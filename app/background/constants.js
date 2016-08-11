/* global chrome:true, window:true, __ENV__ */
/* eslint no-undef: "error" */

import Constants from 'constants-fox';
import db from './lib/db';
import { oauthRequest } from './lib/oauthRequest';
import tokens from './tokens.json';

const CONSUMER_KEY = tokens.consumerKey;
const CONSUMER_SECRET = tokens.consumerSecret;
const VERSION = chrome.runtime.getManifest().version;
const EXT_ID = chrome.runtime.id;

const defaults = {
  autoCacheUserPosts: false,
  autoCacheLikes: false,
  cachedPostsCount: 0,
  cachedLikesCount: 0,
  cachedFollowingCount: 0,
  cachedTagsCount: 0,
  consumerKey: CONSUMER_KEY,
  consumerSecret: CONSUMER_SECRET,
  currentUser: {},
  dashboardCache: [],
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

const constants = new Constants(defaults);

window.constants = constants;

export default constants;
