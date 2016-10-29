/* global chrome:true */
/* eslint no-undef: "error" */

import chromeReceiver from './receivers/chromeReceiver';
import db from './lib/db';
import errorHandler from './handlers/errorHandler';
import idleHandler from './handlers/idleHandler';
import optionsReceiver from './receivers/optionsReceiver';
import loadStartupHandler from './handlers/startupHandler';
import './lib/livereload';

const inExtension = chrome.runtime.onMessage;

const loadChromeEventHandlers = () => {
  chrome.runtime.onMessage.addListener(chromeReceiver);
};

const loadErrorHandler = () => {
  window.addEventListener('unhandledrejection', errorHandler);
};

const loadOptionsEventHandlers = () => {
  chrome.runtime.onConnect.addListener(optionsReceiver);
};

const listenForUpdate = () => {
  chrome.runtime.onUpdateAvailable.addListener(() => {
    chrome.runtime.reload();
  });
};

const listenForIdleState = () => {
  chrome.idle.setDetectionInterval(15);
  chrome.idle.onStateChanged.addListener(idleHandler);
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
