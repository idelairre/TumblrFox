/* global chrome:true */
/* global document:true */
/* global window:true */

import * as Modules from './modules';
import * as Templates from './templates';
import { capitalize, forIn, mapKeys, omit, pick } from 'lodash';
import $ from 'jquery';
import Bridge from './bridge';

forIn(Modules, module => {
  module.prototype.loaded = false;
});

const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

const getParamNames = func => {
  const fnStr = func.toString().replace(STRIP_COMMENTS, '');
  let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (result === null) {
    result = [];
   }
  return result;
}

const injectDependencies = module => { // NOTE: maybe there is a way to memoize the load order?
  module.prototype.dependencies.forEach(dep => {
    // console.log('[CHECKING DEPENDENCY]: ', dep);
    if (Modules[dep].prototype.loaded === false) {
      // console.log('[LOADING DEPENDENCY]: ', dep, Modules[dep].prototype);
      if (Modules[dep].prototype.hasOwnProperty('dependencies')) {
        injectDependencies(Modules[dep])
      }
      const app = document.createElement('script');
      app.setAttribute('type', 'text/javascript');
      app.setAttribute('id', Modules[dep].prototype.constructor.name);
      app.appendChild(document.createTextNode(`(${Modules[dep]})(Tumblr, Backbone, _);`));
      (document.body || document.head || document.documentElement).appendChild(app);
      Modules[dep].prototype.loaded = true;
    }
  });
}

const inject = modules => {
  const deferred = $.Deferred();
  forIn(modules, module => {
    const app = document.createElement('script');
    app.setAttribute('type', 'text/javascript');
    app.setAttribute('id', module.prototype.constructor.name);
    if (module.prototype.loaded === false) {
      // console.log('[LOADING MODULE]: ', module.prototype.constructor.name);
      if (module.prototype.hasOwnProperty('dependencies')) {
        injectDependencies(module);
      }
      app.appendChild(document.createTextNode(`(${module})(Tumblr, Backbone, _);`));
      module.prototype.loaded = true;
      (document.body || document.head || document.documentElement).appendChild(app);
    }
  });
  deferred.resolve();
  return deferred.promise();
};

const injectTemplates = templates => {
  forIn(templates, template => {
    document.body.insertAdjacentHTML('beforeend', template);
  });
};

const inExtension = chrome.runtime.onMessage;

if (inExtension) {
  Bridge.initialize();
}

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');

  injectTemplates(Templates);

  inject(Modules).then(() => {
    console.log('[TUMBLRFOX INITIALIZED]');
  });
}
