/* global chrome:true */
/* global document:true */
/* global window:true */

import * as Modules from './modules';
import * as Templates from './templates';
import Module, { inject, injectTemplates } from './module';
import { forIn } from 'lodash';
import $ from 'jquery';
import Bridge from './bridge';

Modules.App.essential = true;
Modules.ComponentFetcher.essential = true;
Modules.StateModel.essential = true;
Modules.TemplateCache.essential = true;

const inExtension = chrome.runtime.onMessage;

if (inExtension) {
  Bridge.initialize();
}

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');

  injectTemplates(Templates);

  inject(Modules).then(() => {
    console.log('[MODULES INITIALIZED]');
  });
}
