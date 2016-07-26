/* global Promise:true */
/* eslint no-undef: "error" */

import { first, isEqual, isFunction, noop, omit, union } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import filters from '../utils/filters';
import { noopCallback } from '../utils/helpers';
import marshalQuery from '../utils/marshalQuery';
import sortByPopularity from '../utils/sort';
import { logValues, logError } from '../services/loggingService';
import Lunr from '../services/lunrSearchService';
import Source from '../source/likeSource';
import Tags from './tagStore';
import 'babel-polyfill';

let $postsCache = [];

const lastQuery = {};

let caching = false;

export default class Likes {
  static cache(sendResponse) {
    if (caching) {
      return;
    }
    caching = true;
    const sendProgress = isFunction(sendResponse) ? logValues.bind(this, 'likes', sendResponse) : noopCallback;
    const sendError = isFunction(sendResponse) ? logError : noop;
    Source.addListener('items', async posts => {
      await Likes.bulkPut(posts);
      Source.next();
      sendProgress();
    });
    Source.addListener('error', err => {
      sendError(err, sendResponse);
    });
    Source.addListener('done', msg => {
      if (isFunction(sendResponse)) {
        sendResponse({
          type: 'done',
          payload: constants,
          message: msg
        });
      }
      Source.removeListeners();
    });
    Source.start();
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
    } catch (err) {
      console.error(err);
    }
  }

  static async bulkPut(posts) {
    try {
      const promises = posts.map(Likes.put);
      return Promise.all(promises);
    } catch (err) {
      console.error(err);
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
      const response = await db.likes.where('tokens').anyOfIgnoreCase(query.term).or('tags').anyOfIgnoreCase(query.term).filter(_filters).reverse().toArray();
      $postsCache = response;
      return response.slice(query.next_offset, query.next_offset + query.limit);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
      if (post['tumblelog-content-rating'] && post['tumblelog-data'].following) {
        const name = post['tumblelog-data'].name;
        const following = await db.following.get(name);
        if (following) {
          following.content_rating = post['tumblelog-content-rating'];
          db.following.put(following);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}
