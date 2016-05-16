import constants from './constants';
import db from './lib/db';
import Following from './stores/followingStore';
import Likes from './stores/likeStore';
import Tags from './stores/tagStore';
import { oauthRequest } from './lib/oauthRequest';
import './lib/livereload';

function initializeConstants(constants) {
  chrome.storage.sync.get({ userName: '' }, items => {
    if (items.userName === '') {
      chrome.storage.sync.set({ userName: constants.userName });
    }
  });
  chrome.storage.local.get({ currentUser: {}, totalPostsCount: 0, totalFollowingCount: 0 }, items => {
    if (items.currentUser === {}) {
      chrome.storage.sync.set({ currentUser: constants.currentUser.attributes });
    }
    if (items.totalPostsCount === 0) {
      chrome.storage.local.set({ totalPostsCount: constants.currentUser.liked_post_count || constants.totalPostsCount });
    }
    if (items.totalFollowingCount === 0) {
      chrome.storage.local.set({ totalFollowingCount: constants.currentUser.friend_count || constants.totalFollowingCount });
    }
  });
}

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
  const slug = {
    url: 'https://api.tumblr.com/v2/user/info'
  };
  oauthRequest(slug).then(response => {
    constants.userName = response.user.name;
    constants.totalFollowingCount = response.user.following;
    constants.totalPostsCount = response.user.likes;
    initializeConstants(constants);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'initialize') {
    console.log(request.payload);
    constants.userName = request.payload.id;
    constants.currentUser = request.payload;
    initializeConstants(constants);
    initializeListeners();
  }
});

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(request => {
    switch(request.type) {
      case 'cacheLikes':
        if (request.clientCaching) {
          Likes.testPreloadLikes(::port.postMessage);
        } else {
          Likes.preloadLikes(::port.postMessage);
        }
        return true;
      case 'cacheTags':
        Tags.cacheLikeTags(::port.postMessage);
        return true;
      case 'cacheFollowing':
        Following.preloadFollowing(::port.postMessage);
        return true;
      case 'resetCache':
        resetCache(::port.postMessage);
        return true;
      case 'updateSettings':
        Object.assign(constants, request.payload);
      default:
        // do nothing
      }
  });
  port.postMessage({ message: 'initialized', payload: constants });
});

chrome.tabs.onUpdated.addListener(tabId => {
  console.log('[TAB ID]', tabId);
});

function initializeListeners() {
  console.log('[INITIALIZED]', constants);
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[REQUEST]', request);
    switch (request.type) {
      case 'fetchConstants':
        sendResponse(constants);
        return true;
      case 'fetchPosts':
        oauthRequest(request.payload, sendResponse);
        return true;
      case 'fetchFollowing':
        Following.fetchFollowing(request.payload, sendResponse);
        return true;
      case 'updateFollowing':
        Following.syncFollowing(sendResponse);
        return true;
      case 'fetchLikes':
        Likes.fetchLikedPosts(request.payload, sendResponse);
        return true;
      case 'fetchTags':
        Tags.fetchLikeTags(sendResponse);
        return true;
      case 'searchLikes':
        Likes.searchLikes(request.payload, sendResponse);
        return true;
      case 'updateLikes':
        Likes.syncLikes(request.payload);
        return true;
      default:
        // do nothing
    }
  });
}

function resetCache(callback) {
  const response = {
    percentComplete: 0,
    itemsLeft: 0,
    total: 0,
    database: 'all'
  };
  callback(response);
  chrome.storage.local.set({ cachedPostsCount: 0, cachedFollowingCount: 0, cachedTagsCount: 0 }, () => {
    const error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
      callback(error);
    }
  });
  chrome.storage.local.get({
    cachedPostsCount: 0,
    cachedFollowingCount: 0,
    cachedTagsCount: 0,
    totalFollowingCount: 0,
    totalPostsCount: 0,
    totalTagsCount: 0
  }, items => {
    Object.assign(constants, items);
  });
  db.delete().then(() => {
    console.log('[DB] deleted');
    const response = {
      percentComplete: 100,
      itemsLeft: 0,
      total: 0,
      database: 'all'
    };
    callback(response);
    console.log('[CONSTANTS]', constants);
  }).catch(error => {
    console.error('[DB]', error);
    callback(error);
  });
}
