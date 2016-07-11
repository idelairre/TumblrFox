/* global chrome:true */
/* global document:true */
/* global window:true */

import * as Modules from './modules';
import * as Templates from './templates';
import { inject, injectTemplates } from './module';
import Bridge from './bridge';

const inExtension = chrome.runtime.onMessage;


if (inExtension) {
  Bridge.initialize();
  chrome.extension.connect();
}

console.log('@tumblr');

injectTemplates(Templates);

inject([Modules.App, Modules.ComponentFetcher, Modules.TemplateCache, Modules.Wreqr]).then(() => {
  inject(Modules).then(() => {
    console.log('[MODULES INITIALIZED]');
  });
});
