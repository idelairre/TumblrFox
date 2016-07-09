/* global chrome:true */
/* global document:true */
/* global window:true */

import * as Modules from './modules';
import * as Templates from './templates';
import { inject, injectTemplates } from './module';
import Bridge from './bridge';

Modules.App.essential = true;
Modules.ComponentFetcher.essential = true;
Modules.StateModel.essential = true;
Modules.TemplateCache.essential = true;

const inExtension = chrome.runtime.onMessage;

if (inExtension) {
  Bridge.initialize();
}

console.log('@tumblr');

injectTemplates(Templates);

inject(Modules).then(() => {
  console.log('[MODULES INITIALIZED]');
});
