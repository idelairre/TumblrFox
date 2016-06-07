/* global Promise:true */
/* eslint no-undef: "error" */

import $, { ajax, Deferred } from 'jquery';
import async from 'async';
import { differenceBy, isString } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import { log, logError } from '../services/loggingService';
import Tags from './tagStore';
import FuseSearch from '../services/fuseSearchService';
import Source from '../source/likeSource';
import 'babel-polyfill';

export default class Likes {
  static async send(request, sender, sendResponse) {
    const response = await Likes[request.type](request.payload);
    sendResponse(response);
  }

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
            payload: { message: 'Maximum fetchable posts reached.' }
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

  static async put(post) {
    try {
      await db.posts.put(post);
      const count = await db.posts.toCollection().count();
      constants.set('cachedPostsCount', count);
      if (typeof post.tags === 'string') {
        post.tags = JSON.parse(post.tags) || [];
      } else if (typeof post.tags === 'undefined') {
        post.tags = [];
      }
      if (post.tags.length > 0) {
        await Tags.add(post.tags);
      }
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

  static async searchLikesByTerm(query, port) {
    console.log('[QUERY]', query);
    try {
      let matches = await FuseSearch.search(query);
      await Likes._sortByPopularity(matches);
      matches = await Likes._filterByType(query, matches);
      matches = await Likes._filterByDate(query, matches);
      matches = await Likes._filterNSFW(query, matches);
      return matches;
    } catch (e) {
      console.error(e);
    }
  }

  static async _getLikesByTag(args) {
    const deferred = Deferred();
    try {
      const matches = await db.posts.where('tags').anyOfIgnoreCase(args.term).reverse().toArray();
      return deferred.resolve(matches);
    } catch (e) {
      console.error(e);
      return deferred.reject(e);
    }
  }

  static async _filterByDate(query, posts) {
    const deferred = Deferred();
    if (query.before) {
      const date = query.before / 1000;
      posts = posts.filter(post => {
        if (date >= post.liked_timestamp) {
          return post;
        }
      });
    }
    return deferred.resolve(posts);
  }

  static _filterByType(query, posts) {
    const deferred = Deferred();
    if (query.post_type !== 'ANY') {
      const type = query.post_type.toLowerCase();
      posts = posts.filter(post => {
        if (post.type === type) {
          return post;
        }
      });
    }
    return deferred.resolve(posts);
  }

  static _sortByPopularity(query, posts) {
    const deferred = Deferred();
    if (query.sort === 'POPULARITY_DESC') {
      posts = posts.sort((a, b) => {
        return a.note_count > b.note_count ? 1 : (a.note_count < b.note_count ? -1 : 0);
      }).reverse();
    }
    return deferred.resolve(posts);
  }

  static _filterNSFW(query, posts) {
    const deferred = Deferred();
    if (query.filter_nsfw) {
      posts = posts.filter(post => {
        if (!post.hasOwnProperty('tumblelog-content-rating')) {
          return post;
        }
      });
    }
    return deferred.resolve(posts);
  }

  static _filterOriginal(query, posts) {
    const deferred = Deferred();
    if (query.post_role === 'ORIGINAL') {
      posts = posts.filter(post => {
        if (!post.is_reblog) {
          return post;
        }
      });
    }
    return deferred.resolve(posts);
  }

  static async searchLikesByTag(query) {
    console.log('[SEARCH LIKES]', query);
    const deferred = Deferred();
    try {
      const term = (typeof query === 'string' ? query : query.term);
      let matches = [];
      if (term.length > 0) {
        matches = await Likes._getLikesByTag(query);
      } else {
        matches = await db.posts.orderBy('tags').reverse().toArray(); // return all
      }
      await Likes._sortByPopularity(matches);
      matches = await Likes._filterByType(query, matches);
      matches = await Likes._filterByDate(query, matches);
      matches = await Likes._filterNSFW(query, matches);
      matches = await Likes._filterOriginal(query, matches);
      if (query.offset && query.limit) {
        const { offset, limit } = query;
        matches = matches.slice(offset, offset + limit);
      }
      deferred.resolve(matches);
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static async update(request) {
    const { type, html, postId, timestamp } = request.payload;
    if (type === 'like') {
      const postData = Source.processPost(html, timestamp);
      await db.posts.put(postData);
      const count = await db.posts.toCollection().count();
      constants.set('cachedPostsCount', count);
      console.log('[ADDED LIKE]', count);
    } else {
      await db.posts.delete(postId);
      console.log('[REMOVED LIKE]');
    }
  }
}
