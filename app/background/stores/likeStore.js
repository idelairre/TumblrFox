/* global Promise:true */
/* eslint no-undef: "error" */

import $, { ajax, Deferred } from 'jquery';
import async from 'async';
import { differenceBy, findIndex, first, isUndefined, isEqual, isString, isFunction, noop, omit, union } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import filters, { filterNsfw, filterReblogs } from '../utils/filters';
import marshalQuery from '../utils/marshalQuery';
import sortByPopularity from '../utils/sort';
import { logValues, logError } from '../services/loggingService';
import Tags from './tagStore';
import Lunr from '../services/lunrSearchService';
import Source from '../source/likeSource';
import 'babel-polyfill';

const LIMIT = 20000;

const noopCallback = callback => {
  callback();
}

let $postsCache = [];

let lastQuery = {};

let caching = false;

export default class Likes {
  static cache(sendResponse) {
    if (caching) {
      return;
    }
    caching = true;
    const port = isFunction(sendResponse) ? logValues.bind(this, 'likes', sendResponse) : noopCallback;
    const portError = isFunction(sendResponse) ? logError : noop;

    async.doWhilst(async next => {
      try {
        const posts = await Source.start();
        if (typeof posts === 'undefined') {
          logError(Source.MAX_ITEMS_MESSAGE, next, sendResponse);
          caching = false;
        } else {
          await Likes.bulkPut(posts);
          port(() => {
            next(null, posts);
          });
        }
      } catch (e) {
        portError(e, next, sendResponse);
        caching = false;
      }
    }, posts => {
      return posts.length !== 0;
    });
  }

  static async get(id) {
    return await db.likes.get(id);
  }

  static async put(post) { // NOTE: change this into a transaction
    try {
      post.tags = await Tags._updateTags(post);
      post.tokens = union(Lunr.tokenizeHtml(post.html), post.tags);

      await db.likes.put(post);
      if (post['tumblelog-data'] && post['tumblelog-data'].following) {
        await db.following.put(post['tumblelog-data']);
      }
      const count = await db.likes.toCollection().count();
      constants.set('cachedLikesCount', count);
      Likes._updateContentRating(post);
    } catch (e) {
      console.error(e);
    }
  }

  static async bulkPut(posts) {
    try {
      const promises = posts.map(Likes.put);
      return Promise.all(promises);
    } catch (e) {
      console.error(e);
    }
  }

  static cacheFetch(query) {
    return $postsCache.slice(query.next_offset, query.next_offset + query.limit);
  }

  static async searchLikesByTerm(query) {
    try {
      query = marshalQuery(query);
      if (isEqual(lastQuery, omit(query, ['next_offset']))) {
        return Likes.cacheFetch(query);
      }
      const term = query.term;
      const _filters = filters.bind(this, query);
      query.term = Lunr.tokenize(query.term)[0];
      if (typeof query.term === 'undefined') {
        query.term = term;
      }
      Object.assign(lastQuery, omit(query, ['next_offset']));
      if (query.sort !== 'CREATED_DESC') {
        let response = await db.likes.where('tokens').anyOfIgnoreCase(query.term).or('tags').anyOfIgnoreCase(query.term).filter(_filters).reverse().toArray();
        response = sortByPopularity(response);
        $postsCache = response;
        return response.slice(query.next_offset, query.next_offset + query.limit);
      }
      let response = await db.likes.where('tokens').anyOfIgnoreCase(query.term).or('tags').anyOfIgnoreCase(query.term).filter(_filters).reverse().toArray();
      $postsCache = response;
      return response.slice(query.next_offset, query.next_offset + query.limit);
    } catch (e) {
      console.error(e);
    }
  }

  static async fetch(query) { // NOTE: this is a mess, refactor using dexie filters, try to share code with FuseSearch
    query = marshalQuery(query);
    if (isEqual(lastQuery, omit(query, ['next_offset']))) {
      return Likes.cacheFetch(query);
    }
    const _filters = filters.bind(this, query);
    try {
      let matches = [];
      Object.assign(lastQuery, omit(query, ['next_offset']));
      if (query.sort !== 'CREATED_DESC') {
        matches = await db.likes.orderBy('note_count').filter(_filters).reverse().toArray();
      } else if (query.post_type) {
        matches = await db.likes.where('type').anyOfIgnoreCase(query.post_type).filter(_filters).reverse().toArray();
      } else if (query.before) {
        matches = await db.likes.where('liked_timestamp').belowOrEqual(query.before).filter(_filters).reverse().toArray(); // TODO: find a way to speed this up
      } else {
        matches = await db.likes.toCollection().filter(_filters).reverse().toArray();
      }
      $postsCache = matches;
      return matches.slice(query.next_offset, query.next_offset + query.limit);
    } catch (e) {
      console.error(e);
    }
  }

  static async syncLike(postData) {
    if (!Likes.get(postData.id)) {
      postData.tags = Source.processTags(postData.html);
      Likes.put(postData);
    }
  }

  static async updateLikes(request) {
    const { type, postId } = request;
    if (type === 'like') {
      setTimeout(async () => {
        const posts = await Source.fetchMostRecent();
        const post = first(posts.filter(post => {
          if (parseInt(post.id) === parseInt(postId)) {
            return post;
          }
        }));
        await Likes.put(post);
        const count = await db.likes.toCollection().count();
        console.log('[ADDED LIKE]', count);
      }, 300);
    } else {
      await db.likes.delete(postId);
      console.log('[REMOVED LIKE]');
    }
  }

  static async _updateContentRating(post) {
    try {
      if (post.hasOwnProperty('tumblelog-content-rating') && post['tumblelog-data'].following) {
        const name = post['tumblelog-data'].name;
        const following = await db.following.get(name);
        if (following) {
          following.content_rating = post['tumblelog-content-rating'];
          db.following.put(following);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
