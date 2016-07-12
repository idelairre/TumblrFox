/* global chrome:true */
/* eslint no-undef: "error" */

import { Deferred } from 'jquery';
import { oauthRequest } from './lib/oauthRequest';
import { defaultsDeep, pick } from 'lodash';
import db from './lib/db';
import EventEmitter from 'eventemitter3';
import tokens from './tokens.json';
import 'babel-polyfill';

const CONSUMER_KEY = tokens.consumerKey;
const CONSUMER_SECRET = tokens.consumerSecret;
const VERSION = chrome.runtime.getManifest().version;

class Constants extends EventEmitter {
  defaults = {
    cachedPostsCount: 0,
    cachedLikesCount: 0,
    cachedFollowingCount: 0,
    cachedTagsCount: 0,
    currentUser: {},
    debug: false,
    defaultKeys: true,
    eventManifest: [],
    firstRun: false,
    formKey: '',
    maxPostsCount: 0, // NOTE: find a way to determine this
    test: false,
    saveViaFirebase: true,
    setUser: false,
    totalLikesCount: 0,
    totalPostsCount: 0,
    totalFollowingCount: 0,
    totalTagsCount: 0,
    userName: '',
    previousVersion: 0,
    version: 0,
    likeSourceLimits: {
      untilDate: new Date(2007, 1, 1),
      untilPage: 'max'
    },
    likeSourceSlug: {
      timestamp: null,
      page: null,
      url: 'https://www.tumblr.com/likes'
    },
    nextBlogSlug: {
      page: 0,
      url: null
    }
  };

  syncDefaults = {
    userName: '',
    consumerKey: CONSUMER_KEY,
    consumerSecret: CONSUMER_SECRET
  };

  constructor() {
    super();
    this.initialized = false;
    this._previous = {};
    if (__ENV__ !== 'test') {
      this.initialize();
    } else {
      Object.assign(this, defaultsDeep(this, this.defaults));
      Object.assign(this, defaultsDeep(this, this.syncDefaults));
      this.initialized = true;
      this.emit('ready');
    }
  }

  initialize() {
    try {
      this._initializeStorageValues(async () => {
        const response = await oauthRequest({
          url: 'https://api.tumblr.com/v2/user/info'
        });
        if (response) {
          const likesCount = await db.likes.toCollection().count();
          const postsCount = await db.posts.toCollection().count();
          this.set('userName', response.user.name);
          this.set('cachedLikesCount', likesCount);
          this.set('cachedPostsCount', postsCount);
          this.set('totalLikesCount', response.user.likes);
          this.set('totalPostsCount', response.user.blogs[0].posts);
          this.set('totalFollowingCount', response.user.following);
        }
        if (VERSION) {
          this.set('version', VERSION);
        }
        if (this.get('version') !== this.get('previousVersion')) {
          this.set('firstRun', true);
        } else {
          this.set('firstRun', false);
        }
        if (this.initialized) {
          this.emit('reset');
        } else {
          this.initialized = true;
          this.emit('ready');
        }
      });
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

  previous(key) {
    if (!key) {
      return this._previous;
    }
    return this._previous[key];
  }

  reset() {
    this.set('cachedFollowingCount', 0);
    this.set('cachedPostsCount', 0); // NOTE: revert this so that it doesn't set everything to zero
    this.set('cachedLikesCount', 0);
    this.set('cachedTagsCount', 0);
    this.set('nextBlogSlug', this.defaults.nextBlogSlug);
    this.set('likeSourceLimits', this.defaults.likeSourceLimits);
    this.set('likeSourceSlug', this.defaults.likeSourceSlug);
    this.initialize();
  }

  toJSON() {
    const keys = Object.keys(this.defaults);
    const vals = pick(this, keys);
    return vals;
  }

  _assign(items) {
    for (const key in items) {
      if ({}.hasOwnProperty.call(items, key)) {
        if (typeof this.key !== 'undefined') {
          this._previous[key] = this[key];
        } else {
          this._previous[key] = items[key]; // we'll assume here this is on initialization
        }
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

  _initializeStorageValues(callback) {
    chrome.storage.local.get(this.defaults, items => {
      Object.assign(this, defaultsDeep(this, items));
      chrome.storage.sync.get(this.syncDefaults, items => {
        Object.assign(this, defaultsDeep(this, items));
        Object.assign(this._previous, pick(this, Object.keys(this.defaults)));
        if (callback) {
          callback();
        }
      });
    });
  }
}

const constants = new Constants();

export default constants;
