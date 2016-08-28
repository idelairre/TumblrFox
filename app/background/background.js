/* global chrome:true */
/* eslint no-undef: "error" */

import chromeReceiver from './receivers/chromeReceiver';
import db from './lib/db';
import idleHandler from './handlers/idleHandler';
import optionsReceiver from './receivers/optionsReceiver';
import startupHandler from './handlers/startupHandler';
import './lib/livereload';

const inExtension = chrome.runtime.onMessage;

const loadChromeEventHandlers = () => {
  chrome.runtime.onMessage.addListener(chromeReceiver);
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
  loadOptionsEventHandlers();
  listenForUpdate();
  listenForIdleState();
}

chrome.runtime.onStartup.addListener(startupHandler);

window.db = db;
