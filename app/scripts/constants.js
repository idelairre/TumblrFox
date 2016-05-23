/* global chrome:true */
/* eslint no-undef: "error" */

import { Deferred } from 'jquery';
import { oauthRequest } from './lib/oauthRequest';
import db from './lib/db';
import Likes from './stores/likeStore';
import tokens from './tokens.json';
import 'babel-polyfill';

const CONSUMER_KEY = tokens.consumerKey;
const CONSUMER_SECRET = tokens.consumerSecret;

class Constants {
  defaults = {
    cachedPostsCount: 0,
    cachedFollowingCount: 0,
    cachedTagsCount: 0,
    maxPostsCount: 0, // NOTE: find a way to determine this
    totalPostsCount: 0,
    totalFollowingCount: 0,
    totalTagsCount: 0,
    canFetchApiLikes: true,
    clientCaching: false,
    debug: false,
    defaultKeys: true,
    fullTextSearch: true,
    saveViaFirebase: true,
    saveAsCsv: false,
    setUser: false,
    currentUser: {},
    nextSlug: {},
    userName: '',
    consumerKey: CONSUMER_KEY,
    consumerSecret: CONSUMER_SECRET
  };

  constructor() {
    this._events = {};
    this.initialize();
  }

	addListener(event, fct) {
		this._events = this._events || {};
		this._events[event] = this._events[event]	|| [];
		this._events[event].push(fct);
	}

	removeListener(event, fct) {
		this._events = this._events || {};
		if (event in this._events === false) {
      return;
    }
		this._events[event].splice(this._events[event].indexOf(fct), 1);
	}

	trigger(event /* , args... */) {
		this._events = this._events || {};
		if (event in this._events === false) {
      return;
    }
		for (let i = 0; i < this._events[event].length; i += 1) {
			this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}

  async initialize() {
    try {
      await this._initializeStorageValues();
      const response = await oauthRequest({
        url: 'https://api.tumblr.com/v2/user/info'
      });
      const postsCount = await db.posts.toCollection().count();
      const canFetchApiLikes = await Likes.check(response.user.name);
      this.set('userName', response.user.name);
      this.set('canFetchApiLikes', canFetchApiLikes);
      this.set('cachedPostsCount', postsCount);
      this.set('totalPostsCount', response.user.likes);
      this.set('totalFollowingCount', response.user.following);
    } catch (e) {
      console.error(e);
    }
  }

  get(key) {
    return this[key];
  }

  set(key, value) {
    if (typeof key === 'object') {
      this._assign(key);
      this._setStorage(key);
    } else {
      this[key] = value;
      if (key === 'userName' || key === 'consumerKey' || key === 'consumerSecret') {
        const syncSlug = {};
        syncSlug[key] = value;
        chrome.storage.sync.set(syncSlug);
      } else {
        const storageSlug = {}; // NOTE: you need to use this pattern in order to programmatically set chrome storage key value pairs
        storageSlug[key] = value;
        chrome.storage.local.set(storageSlug);
      }
    }
  }

  reset() {
    this.set('cachedTagsCount', 0);
    this.set('cachedPostsCount', 0);
    this.set('cachedFollowingCount', 0);
    this.set('nextSlug', {});
  }

  _assign(items) {
    for (const key in items) {
      if ({}.hasOwnProperty.call(items, key)) {
        this[key] = items[key];
      }
    }
  }

  _setStorage(key) {
    if (key.hasOwnProperty('userName') && key.userName !== this.userName) {
      chrome.storage.sync.set({
        userName: key.userName
      });
    } else if (key.hasOwnProperty('consumerKey') && key.consumerKey !== this.consumerKey) {
      chrome.storage.sync.set({
        consumerKey: key.consumerKey
      });
    } else if (key.hasOwnProperty('consumerSecret') && key.consumerSecret !== this.consumerSecret) {
      chrome.storage.sync.set({
        consumerSecret: key.consumerSecret
      });
    }
    chrome.storage.local.set(key);
    // chrome.storage.local.get(key, items => {
    //   console.log('[ITEMS]:', items);
    // });
  }

  _initializeStorageValues() {
    const deferred = Deferred();
    chrome.storage.local.get({
      cachedPostsCount: 0,
      cachedFollowingCount: 0,
      cachedTagsCount: 0,
      maxPostCount: 0,
      totalPostsCount: 0,
      totalFollowingCount: 0,
      totalTagsCount: 0,
      canFetchApiLikes: false,
      clientCaching: false,
      debug: false,
      defaultKeys: true,
      fullTextSearch: true,
      saveViaFirebase: true,
      saveAsCsv: false,
      setUser: false,
      currentUser: {},
      nextSlug: {}
    }, items => {
      this._assign(items);
    });
    chrome.storage.sync.get({
      userName: '',
      consumerKey: CONSUMER_KEY,
      consumerSecret: CONSUMER_SECRET
    }, items => {
      this._assign(items);
      deferred.resolve();
    });
    return deferred.promise();
  }
}

const constants = new Constants();

export default constants;
