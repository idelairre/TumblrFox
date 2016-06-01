/* global Promise:true */
/* global alert:true */
/* eslint no-undef: "error" */

import $, { ajax, Deferred } from 'jquery';
import async from 'async';
import { differenceBy, isString } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import { log, logError } from '../services/logging';
import Tags from './tagStore';
import FuseSearch from '../services/fuseSearch';
import Source from '../source/source';
import 'babel-polyfill';

export default class Likes {
  static async send(request, sender, sendResponse) {
    const response = await Likes[request.type](request.payload);
    sendResponse(response);
  }

  static async cache(sendResponse) {
    const items = {
      cachedPostsCount: constants.get('cachedPostsCount'),
      totalPostsCount: constants.get('totalPostsCount')
    }
    async.doWhilst(async next => {
      try {
        const posts = await Source.start(sendResponse);
        await Likes.bulkPut(posts);
        items.cachedPostsCount = constants.get('cachedPostsCount');
        log('posts', items, response => {
          sendResponse(response);
          next(null, response);
        });
      } catch (e) {
        logError(e, next, sendResponse)
      }
    }, response => {
      return response;
    });
  }

  static async put(post) {
    try {
      await db.posts.put(post);
      const count = await db.posts.toCollection().count();
      constants.set('cachedPostsCount', count);
      console.log(post);
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
    try {
      let matches = await FuseSearch.search(query);
      if (query.sort === 'POPULARITY_DESC') {
        await Likes._sortByPopularity(matches);
      }
      if (query.post_type !== 'ANY') {
        matches = await Likes._filterByType(query, matches);
      }
      if (query.before) {
        matches = await Likes._filterByDate(query, matches);
      }
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

  static async _filterByDate(args, posts) {
    const deferred = Deferred();
    const date = args.before / 1000;
    posts = posts.filter(post => {
      if (date >= post.liked_timestamp) {
        return post;
      }
    });
    return deferred.resolve(posts);
  }

  static _filterByType(args, posts) {
    const deferred = Deferred();
    const type = args.post_type.toLowerCase();
    posts = posts.filter(post => {
      if (post.type === type) {
        return post;
      }
    });
    return deferred.resolve(posts);
  }

  static _sortByPopularity(posts) {
    const deferred = Deferred();
    posts = posts.sort((a, b) => {
      return a.note_count > b.note_count ? 1 : (a.note_count < b.note_count ? -1 : 0);
    }).reverse();
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
      if (query.sort === 'POPULARITY_DESC') {
        await Likes._sortByPopularity(matches);
      }
      if (query.post_type !== 'ANY') {
        matches = await Likes._filterByType(query, matches);
      }
      if (query.before) {
        matches = await Likes._filterByDate(query, matches);
      }
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

  static async sync(payload) {
    console.log(payload);
    let count = await db.posts.toCollection().count();
    console.log('[POSTS BEFORE]', count);
    const cachedPost = await db.posts.get(payload.id);
    if (cachedPost && !cachedPost.hasOwnProperty('html')) {
      const postData = Likes._testProcessPost(payload.html, cachedPost.liked_timestamp);
      await db.posts.put(postData);
    }
    count = await db.posts.toCollection().count();
    console.log('[POSTS AFTER]', count);
  }

  static async update(request) {
    const { type, html, postId, timestamp } = request.payload;
    if (type === 'like') {
      const postData = Source.processPost(html, timestamp);
      await db.posts.put(postData);
      const count = await db.posts.toCollection().count();
      constants.set('totalPostsCount', count);
      console.log('[ADDED LIKE]', count);
    } else {
      await db.posts.delete(postId);
      console.log('[REMOVED LIKE]');
    }
  }
}
