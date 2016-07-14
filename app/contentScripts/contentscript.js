/* global chrome:true */
/* global document:true */
/* global window:true */

import * as Modules from './modules';
import * as Templates from './templates';
import { inject, injectTemplates } from './moduleLoader';
import Bridge from './bridge';
import { omit } from 'lodash';
import './lib/jasmine.css';

const inExtension = chrome.runtime.onMessage;

if (inExtension) {
  Bridge.initialize();
  // chrome.extension.connect();
}

console.log('@tumblr');

injectTemplates(Templates);

inject([Modules.App, Modules.ComponentFetcher, Modules.TemplateCache, Modules.Wreqr]).then(() => { // this could be prettier
  if (Bridge.constants.test) {
    inject([Modules.Jasmine, Modules.JasmineHtml, Modules.JasmineConsole, Modules.JasmineBoot]).then(() => {
      inject(Modules);
    });
  } else {
    inject(Modules, {
      omit: ['Jasmine', 'JasmineHtml', 'JasmineConsole', 'JasmineBoot', 'TestComponent']
    });
  }
});
