/* global chrome:true */
/* eslint no-undef: "error" */

import constants from './constants';
import db from './lib/db';
import chromeReceiver from './receivers/chromeReceiver';
import optionsReceiver from './receivers/optionsReceiver';
import { oauthRequest } from './lib/oauthRequest';
import './lib/livereload';
import 'babel-polyfill';

const inExtension = chrome.runtime.onMessage;

const loadChromeEventHandlers = () => {
  chrome.runtime.onMessage.addListener(chromeReceiver);
};

const loadOptionsEventHandlers = () => {
  chrome.runtime.onConnect.addListener(optionsReceiver);
}

if (inExtension) {
  loadChromeEventHandlers();
  loadOptionsEventHandlers();
}

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  console.log('[TAB ID]', tabId);
});
