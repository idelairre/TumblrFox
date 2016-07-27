/* global chrome:true, window:true, __ENV__ */
/* eslint no-undef: "error" */

import { defaultsDeep, pick } from 'lodash';
import EventEmitter from 'eventemitter3';
import db from './lib/db';
import { oauthRequest } from './lib/oauthRequest';
import tokens from './tokens.json';
import 'babel-polyfill';

const CONSUMER_KEY = tokens.consumerKey;
const CONSUMER_SECRET = tokens.consumerSecret;
const VERSION = chrome.runtime.getManifest().version;
const EXT_ID = chrome.runtime.id;

class Constants extends EventEmitter {
  defaults = {
    autoCacheUserPosts: false,
    autoCacheLikes: false,
    cachedPostsCount: 0,
    cachedLikesCount: 0,
    cachedFollowingCount: 0,
    cachedTagsCount: 0,
    currentUser: {},
    debug: false,
    defaultKeys: true,
    env: __ENV__,
    eventManifest: [],
    extensionId: EXT_ID,
    firstRun: false,
    formKey: '',
    maxLikesCount: 0,
    clientTests: false,
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
    nextLikeSourceSlug: {
      timestamp: null,
      page: null,
      url: 'https://www.tumblr.com/likes'
    },
    nextBlogSourceSlug: {
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
    this.initialize();
  }

  initialize() {
    this._initializeStorageValues(() => {
      if (VERSION) {
        this.set('version', VERSION);
      }
      if (this.get('version') === this.get('previousVersion')) {
        this.set('firstRun', false);
      } else {
        this.set('firstRun', true);
      }
      if (this.initialized) {
        this.emit('reset');
        return;
      }
      this.initialized = true;
      this.emit('ready');
    });
  }

  async getUser() {
    try {
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
    } catch (err) {
      console.error(err);
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
    this.set('nextBlogSourceSlug', this.defaults.nextBlogSourceSlug);
    this.set('likeSourceLimits', this.defaults.likeSourceLimits);
    this.set('nextLikeSourceSlug', this.defaults.nextLikeSourceSlug);
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
        if (typeof this.key === 'undefined') {
          this._previous[key] = items[key]; // we'll assume here this is on initialization
        } else {
          this._previous[key] = this[key];
        }
        this[key] = items[key];
      }
    }
  }

  _setStorage(key) {
    if ({}.hasOwnProperty.call(key, 'userName') && key.userName !== this.userName) {
      chrome.storage.sync.set({
        userName: key.userName
      });
    } else if ({}.hasOwnProperty.call(key, 'consumerKey') && key.consumerKey !== this.consumerKey) {
      chrome.storage.sync.set({
        consumerKey: key.consumerKey
      });
    } else if ({}.hasOwnProperty.call(key, 'consumerSecret') && key.consumerSecret !== this.consumerSecret) {
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

constants.getUser();

window.constants = constants;

export default constants;
