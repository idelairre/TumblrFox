import { capitalize, drop, forIn, isEmpty, mapKeys, pick } from 'lodash';
import $ from 'jquery';

const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

const TumblrComponents = [
  'animation',
  'AutoComplete',
  'BlogSearch',
  'BlogSearchAutocompleteHelper',
  'BlogSearchPopover',
  'ConversationsCollection',
  'ClickHandler',
  'EventBus',
  'InboxCompose',
  'PrimaComponent',
  'PopoverMixin',
  'PeeprBlogSearch',
  'SearchResultView',
  'KeyCommandsMixin',
  'Loader',
  'Mixin',
  'SearchFilters',
  'SearchFiltersPopover',
  'SearchInput',
  'TagsPopover',
  'TumblrModel',
  'TumblrView',
  'SingletonModel'
];

const attachScript = (modules, module, name) => {
  const app = document.createElement('script');
  app.setAttribute('type', 'text/javascript');
  app.setAttribute('id', name);
  app.appendChild(document.createTextNode(`(${module})(${formatDependencies(modules, module)});`));
  (document.body || document.head || document.documentElement).appendChild(app);
  modules[name].prototype.loaded = true;
}


const getParamNames = func => {
  const fnStr = func.toString().replace(STRIP_COMMENTS, '');
  let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (result === null) {
    result = [];
   }
  return result;
}

const formatDependencies = (modules, module) => {
  let dependencies = getParamNames(module);
  return dependencies.map(dep => {
    if (modules[dep] || TumblrComponents.includes(dep)) {
      dep = `Tumblr.Fox.Utils.ComponentFetcher.get('${dep}')`;
    }
    return dep;
  });
}

const validateDependencies = (modules, dependencies) => {
  if (isEmpty(dependencies)) {
    return true;
  }
  dependencies.forEach(dep => {
    if (!modules[dep].prototype.loaded) {
      return false;
    }
  });
  return true;
}

const validateModules = modules => {
  let valid = true;
  forIn(modules, (module, name) => {
    if (!module.prototype.loaded) {
      valid = false;
      console.error('[MODULE NOT LOADED]: ', name);
    }
  });
  console.log('[MODULES LOADED SUCCESSFULLY?]', valid);
}

const injectDependencies = (modules, module) => { // NOTE: maybe there is a way to memoize the load order?
  module.prototype.dependencies.forEach(dep => {
    if (modules.hasOwnProperty(dep) && modules[dep].hasOwnProperty('prototype') && modules[dep].prototype.loaded === false) {
      if (modules[dep].prototype.hasOwnProperty('dependencies')) {
        injectDependencies(modules, modules[dep]);
        // console.log(validateDependencies(modules, modules[dep].prototype.dependencies));
      }
      attachScript(modules, modules[dep], dep);
    }
  });
}

export const inject = modules => {
  const deferred = $.Deferred();
  forIn(modules, (module, name) => {
    if (module.prototype.loaded) {
      return;
    }
    module.prototype.loaded = false;
    let dependencies = getParamNames(module).filter(param => {
      if (param !== 'Tumblr' && param !== 'Backbone' && param !== '_' ) {
        return param;
      }
    });
    if (dependencies.length > 0) {
      module.prototype.dependencies = dependencies;
    }
  });
  forIn(modules, (module, name) => {
    if (module.essential && !module.prototype.loaded) {
      attachScript(modules, module, name);
    }
  });
  forIn(modules, (module, name) => {
    if (!module.prototype.loaded) {
      if (module.prototype.hasOwnProperty('dependencies')) {
        injectDependencies(modules, module);
      }
      attachScript(modules, module, name);
    }
  });
  validateModules(modules);
  deferred.resolve();
  return deferred.promise();
};

export const injectTemplates = templates => {
  forIn(templates, template => {
    document.body.insertAdjacentHTML('beforeend', template);
  });
};

const modifyParams = (module, params) => {
  const fnStr = module.toString().replace(STRIP_COMMENTS, '');
  module = module.toString();
  const body = module.substring(module.indexOf('{') + 1, module.lastIndexOf('}'));
  module = new Function(params, body);
  return module;
}

const Module = function (dependencies, module) {
  this.dependencies = getParamNames(module);
  return modifyParams(module, this.dependencies);
}

export default Module;
