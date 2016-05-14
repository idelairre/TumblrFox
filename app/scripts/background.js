import constants from './constants';
import { resetCache } from './lib/db';
import Following from './stores/following';
import Likes from './stores/likes';
import Tags from './stores/tags';
import { oauthRequest } from './lib/oauthRequest';
import './lib/livereload';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  switch (request.type) {
    case 'sendData':
      constants.currentUser = request.payload.currentUser;
      break;
    case 'fetchConstants':
    console.log(constants.debug);
      sendResponse(constants.debug);
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

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(request => {
    switch(request.type) {
      case 'cacheLikes':
        Likes.preloadLikes(::port.postMessage);
        break;
      case 'cacheTags':
        Tags.cacheLikeTags(::port.postMessage);
        break;
      case 'cacheFollowing':
        Following.preloadFollowing(::port.postMessage);
        break;
      case 'resetCache':
        resetCache(::port.postMessage);
        break;
      default:
        // do nothing
      }
  });
  port.postMessage('initialized');
});

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  console.log('[TAB ID]', tabId);
});
