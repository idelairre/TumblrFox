/* global chrome:true */
/* eslint no-undef: "error" */

import chromeReceiver from './receivers/chromeReceiver';
import Cache from './services/cacheService';
import db from './lib/db';
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
}


if (inExtension) {
  loadChromeEventHandlers();
  loadOptionsEventHandlers();
  listenForUpdate();
}

db.on('ready', () => {
  Cache.updateTokens();
  Cache.updateNotes();
  Cache.updateFollowingFromLikes();
});

chrome.idle.setDetectionInterval(15);

chrome.idle.onStateChanged.addListener(idleState => {
  console.log(idleState);
});

window.db = db;
