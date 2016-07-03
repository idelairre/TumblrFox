/* global Promise:true */
/* eslint no-undef: "error" */

import $, { ajax, Deferred } from 'jquery';
import async from 'async';
import { differenceBy, findIndex, first, isString } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import { log, logError } from '../services/loggingService';
import Tags from './tagStore';
import Lunr from '../services/lunrSearchService';
import Source from '../source/likeSource';
import 'babel-polyfill';

const LIMIT = 20000;

export default class Likes {
  static cache(sendResponse) {
    const items = {
      cachedPostsCount: constants.get('cachedPostsCount'),
      totalPostsCount: constants.get('totalPostsCount')
    };
    const opts = {
      untilPage: constants.get('fetchLikesUntil').page,
      untilTimestamp: constants.get('fetchLikesUntil').date / 1000
    };
    async.doWhilst(async next => {
      try {
        const posts = await Source.start(sendResponse, opts);
        if (posts.length === 0) {
          sendResponse({
            type: 'done',
            payload: {
              message: Source.MAX_ITEMS_MESSAGE
            }
          });
          next(null, items);
        } else {
          await Likes.bulkPut(posts);
          items.cachedPostsCount = constants.get('cachedPostsCount');
          log('posts', items, progress => {
            sendResponse(progress);
            next(null, posts);
          });
        }
      } catch (e) {
        logError(e, next, sendResponse);
      }
    }, posts => {
      return posts.length !== 0;
    });
  }

  static async get(id) {
    return await db.posts.get(id);
  }

  static async put(post) {
    try {
      post.tags = Likes._updateTags(post);
      post.tokens = Lunr.tokenize(post.html);
      await db.posts.put(post);
      const count = await db.posts.toCollection().count();
      constants.set('cachedPostsCount', count);
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

  static _testFilters(query, post) {
    let valid = true;
    if (query.blogname && query.blogname !== '') {
      valid = post.blog_name.toLowerCase().includes(query.blogname.toLowerCase());
    }
    if (query.post_type && query.post_type !== 'any') {
      valid = post.type.includes(query.post_type);
    }
    if (query.post_role && query.post_role === 'ORIGINAL') {
      valid = !post.is_reblog;
    }
    if (query.filter_nsfw) {
      if (post.hasOwnProperty('tumblelog-content-rating') && post['tumblelog-content-rating'] === 'nsfw' || post['tumblelog-content-rating'] === 'adult') {
        valid = false;
      }
    }
    if (query.before) {
      if (!((query.before / 1000) >= post.liked_timestamp)) {
        valid = false;
      }
    }
    return valid;
  }

  static async searchLikesByTerm(query) {
    try {
      query = Likes._marshalQuery(query);
      const term = query.term;
      const filters = Likes._testFilters.bind(this, query);
      query.term = Lunr.tokenize(query.term)[0];
      if (typeof query.term === 'undefined') {
        query.term = term;
      }
      if (query.sort !== 'CREATED_DESC') {
        let response = await db.posts.where('tokens').anyOfIgnoreCase(query.term).filter(filters).toArray();
        response = Likes._sortByPopularity(response);
        return response.slice(query.next_offset, query.next_offset + query.limit);
      }
      const response = await db.posts.where('tokens').anyOfIgnoreCase(query.term).filter(filters).toArray(); // NOTE: using dexie's native offset method here slows this down drastically since it has to iterate through the whole collection
      return response.slice(query.next_offset, query.next_offset + query.limit);
    } catch (e) {
      console.error(e);
    }
  }

  static _sortByPopularity(posts) {
    return posts.sort((a, b) => {
      return a.note_count - b.note_count;
    }).reverse();
  }

  static _marshalQuery(query) {
    const type = query.post_type.toLowerCase();
    if (type === 'text') {
      query.post_type = 'regular';
    } else if (type === 'answer') {
      query.post_type = 'note';
    } else if (type === 'chat') {
      query.post_type = 'conversation';
    } else {
      query.post_type = type;
    }
    return query;
  }

  static async fetch(query) { // NOTE: this is a mess, refactor using dexie filters, try to share code with FuseSearch
    query = Likes._marshalQuery(query);
    const filters = Likes._testFilters.bind(this, query);
    try {
      let matches = [];
      if (query.sort !== 'CREATED_DESC') {
        matches = await db.posts.orderBy('note_count').filter(filters).reverse().toArray();
      } else if (query.post_type !== 'any') {
        matches = await db.posts.where('type').anyOfIgnoreCase(query.post_type).filter(filters).toArray();
      } else {
        matches = await db.posts.toCollection().filter(filters).toArray();
      }
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
        const count = await db.posts.toCollection().count();
        console.log('[ADDED LIKE]', count);
      }, 300);
    } else {
      await db.posts.delete(postId);
      console.log('[REMOVED LIKE]');
    }
  }

  static _updateTags(post) {
    if (typeof post.tags === 'string') {
      post.tags = JSON.parse(post.tags) || [];
    } else if (typeof post.tags === 'undefined') {
      post.tags = [];
    }
    if (post.tags.length > 0) {
      Tags.add(post.tags);
    }
    return post.tags;
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
