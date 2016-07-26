/* global chrome:true */
/* eslint no-undef: "error" */

import chromeReceiver from './receivers/chromeReceiver';
import db from './lib/db';
import idleService from './services/idleService';
import optionsReceiver from './receivers/optionsReceiver';
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
  chrome.idle.onStateChanged.addListener(idleService);
};

if (inExtension) {
  loadChromeEventHandlers();
  loadOptionsEventHandlers();
  listenForUpdate();
  listenForIdleState();
}

window.db = db;
