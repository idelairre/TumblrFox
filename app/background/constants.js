/* global chrome:true */
/* eslint no-undef: "error" */

import { Deferred } from 'jquery';
import { oauthRequest } from './lib/oauthRequest';
import { pick } from 'lodash';
import db from './lib/db';
import EventEmitter from 'eventemitter3';
import tokens from './tokens.json';
import 'babel-polyfill';

const CONSUMER_KEY = tokens.consumerKey;
const CONSUMER_SECRET = tokens.consumerSecret;

class Constants extends EventEmitter {
  defaults = {
    cachedPostsCount: 0,
    cachedFollowingCount: 0,
    cachedTagsCount: 0,
    maxPostsCount: 0, // NOTE: find a way to determine this
    totalPostsCount: 0,
    totalFollowingCount: 0,
    totalTagsCount: 0,
    canFetchApiLikes: true,
    debug: false,
    defaultKeys: true,
    formKey: '',
    fullTextSearch: true,
    saveViaFirebase: true,
    setUser: false,
    currentUser: {},
    fetchLikesUntil: {
      date: new Date(2007, 1, 1),
      page: 'max'
    },
    nextSlug: {
      timestamp: null,
      page: 1
    },
    userName: ''
  };

  constructor() {
    super();
    this.initialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      await this._initializeStorageValues();
      if (!this.get('userName') || !this.get('cachedPostsCount') || !this.get('totalPostsCount') || !this.get('totalFollowingCount')) {
        const response = await oauthRequest({
          url: 'https://api.tumblr.com/v2/user/info'
        });
        const postsCount = await db.posts.toCollection().count();
        this.set('userName', response.user.name);
        this.set('cachedPostsCount', postsCount);
        this.set('totalPostsCount', response.user.likes);
        this.set('totalFollowingCount', response.user.following);
      }
      this.initialized = true;
      this.emit('ready');
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
    this.set('cachedTagsCount', this.defaults.cachedTagsCount);
    this.set('cachedPostsCount', this.defaults.cachedPostsCount);
    this.set('cachedFollowingCount', this.defaults.cachedFollowingCount);
    this.set('nextSlug', this.defaults.nextSlug);
    this.emit('reset');
  }

  toJSON() {
    const keys = Object.keys(this.defaults);
    const vals =  pick(this, keys);
    return vals;
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
  }

  _initializeStorageValues() {
    const deferred = Deferred();
    chrome.storage.local.get(this.defaults, items => {
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
