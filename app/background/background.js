/* global chrome:true */
/* global browser:true */
/* eslint no-undef: "error" */

import browser from './lib/browserPolyfill';
import chromeReceiver from './receivers/chromeReceiver';
import db from './lib/db';
import errorHandler from './handlers/errorHandler';
import idleHandler from './handlers/idleHandler';
import optionsReceiver from './receivers/optionsReceiver';
import loadStartupHandler from './handlers/startupHandler';
import sendMessage from './services/messageService';
import './lib/livereload';

const inExtension = browser.runtime.onMessage;

const loadChromeEventHandlers = () => {
  browser.runtime.onMessage.addListener(chromeReceiver);
};

const loadErrorHandler = () => {
  window.onerror = errorHandler;
};

const loadOptionsEventHandlers = () => {
  browser.runtime.onConnect.addListener(optionsReceiver);
};

const listenForUpdate = () => {
  browser.runtime.onUpdateAvailable.addListener(() => browser.runtime.reload());
};

const listenForIdleState = () => {
  browser.idle.setDetectionInterval(400000);
  browser.idle.onStateChanged.addListener(idleHandler);
};

if (inExtension) {
  loadChromeEventHandlers();
  loadErrorHandler();
  loadStartupHandler();
  loadOptionsEventHandlers();
  listenForUpdate();
  listenForIdleState();
}

window.db = db;
