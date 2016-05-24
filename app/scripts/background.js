/* global chrome:true */
/* eslint no-undef: "error" */

import constants from './constants';
import db from './lib/db';
import Cache from './stores/cache';
import Following from './stores/followingStore';
import Keys from './stores/keyStore';
import Likes from './stores/likeStore';
import Tags from './stores/tagStore';
import { oauthRequest } from './lib/oauthRequest';
import './lib/livereload';
import 'babel-polyfill';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

// Tumblr/dropdown listeners

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[REQUEST]', request);
  switch (request.type) {
    case 'fetchConstants':
      setTimeout(() => {
        sendResponse(constants);
      }, 1);
      return true;
    case 'fetchKeys':
      if (request.payload) {
        Keys.fetch(request.payload).then(sendResponse);
      } else {
        Keys.fetch().then(sendResponse);
      }
      return true;
    case 'fetchPosts':
      oauthRequest(request.payload).then(sendResponse);
      return true;
    case 'fetchFollowing':
      Following.fetch(request.payload, sendResponse);
      return true;
    case 'refreshFollowing':
      Following.preload(sendResponse);
      return true;
    case 'updateFollowing':
      Following.sync(sendResponse);
      return true;
    case 'fetchLikes':
      Likes.fetch(request.payload, sendResponse);
      return true;
    case 'fetchTags':
      Tags.fetch(sendResponse);
      return true;
    case 'searchLikesByTag':
      Likes.searchByTag(request.payload, sendResponse);
      return true;
    case 'searchLikesByTerm':
      Likes.searchByTerm(request.payload, sendResponse);
      return true;
    case 'syncLikes':
      Likes.sync(request.payload);
      return true;
    case 'updateLikes':
      Likes.update(request.payload);
      return true;
    default:
      // do nothing
  }
});

/**
 * NOTE: do not remove these "return true"'s
 * Chrome docs: "This function becomes invalid when the event listener returns,
 * unless you return true from the event listener to indicate you wish to send a response asynchronously
 * (this will keep the message channel open to the other end until sendResponse is called).
 */

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(request => {
    console.log('[REQUEST]', request);
    switch (request.action) {
      case 'fetchConstants':
        port.postMessage({
          action: 'replyConstants',
          payload: constants
        });
        return true;
      case 'cacheLikes':
        if (constants.get('clientCaching')) {
          Likes.testPreload(::port.postMessage);
        } else {
          Likes.preload(::port.postMessage);
        }
        return true;
      case 'cacheTags':
        Tags.cache(::port.postMessage);
        return true;
      case 'cacheFollowing':
        Following.preload(::port.postMessage);
        return true;
      case 'checkLikes':
        Likes.check(constants.get('userName')).then(response => {
          constants.set('canFetchApiLikes', response);
          port.postMessage({
            message: 'canFetchApiLikesStatus',
            payload: constants.canFetchApiLikes
          });
        });
        return true;
      case 'downloadCache':
      console.log(constants.get('saveAsCsv'));
        if (constants.get('saveViaFirebase')) {
          Cache.uploadCache(::port.postMessage);
        } else {
          if (constants.get('saveAsCsv')) {
            Cache.assembleCacheAsCsv(::port.postMessage);
          } else {
            Cache.assembleCacheAsJson(::port.postMessage);
          }
        }
        return true;
      case 'resetCache':
        Cache.resetCache(::port.postMessage);
        return true;
      case 'restoreCache':
        Cache.restoreCache(request.payload, ::port.postMessage);
        return true;
      case 'updateSettings':
        constants.set(request.payload);
        return true;
      default:
        // do nothing
      }
  });
});

chrome.tabs.onUpdated.addListener(tabId => {
  console.log('[TAB ID]', tabId);
});
