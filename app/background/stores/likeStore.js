/* global Promise:true */
/* eslint no-undef: "error" */

import $, { ajax, Deferred } from 'jquery';
import async from 'async';
import { differenceBy, findIndex, isString } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import { log, logError } from '../services/loggingService';
import Tags from './tagStore';
import FuseSearch from '../services/fuseSearchService';
import Source from '../source/likeSource';
import 'babel-polyfill';

const LIMIT = 4000;

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
            payload: { message: Source.MAX_ITEMS_MESSAGE }
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

  static _applyFilters(query, matches) {
    if (query.blogname) {
      matches = matches.filter(post => {
        if (post.blog_name === query.blogname) {
          return post;
        }
      });
    }
    if (query.post_type !== 'any') {
      matches = Likes._filterByType(query, matches);
    }
    if (query.post_role) {
      matches = Likes._filterOriginal(query, matches);
    }
    if (query.filter_nsfw) {
      matches = Likes._filterNSFW(query, matches);
    }
    if (query.sort === 'POPULARITY_DESC') {
      Likes._sortByPopularity(matches);
    }
    return matches;
  }

  static async searchLikesByTerm(query, port) {
    const deferred = Deferred();
    if (query.term.length === 0) {
      deferred.reject('Term cannot be empty');
    }
    query = Likes._marshalQuery(query);
    let posts = [];
    try {
      if (FuseSearch.initialized) {
        let matches = await FuseSearch.search(query);
        matches = Likes._applyFilters(query, matches);
        if (matches.length > 1000) {
          matches = matches.slice(0, 1000);
        }
        deferred.resolve(matches);
      } else {
        FuseSearch.addListener('ready', async () => {
          let matches = await FuseSearch.search(query);
          matches = Likes._applyFilters(query, matches);
          if (matches.length > 1000) {
            matches = matches.slice(0, 1000);
          }
          deferred.resolve(matches);
        });
      }
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static async _filterByDate(query, posts) {
    const deferred = Deferred();
    const date = query.before / 1000;
    return posts.filter(post => {
      if (date >= post.liked_timestamp) {
        return post;
      }
    });
  }

  static _filterByType(query, posts) {
    const type = query.post_type.toLowerCase();
    return posts.filter(post => {
      if (post.type === type) {
        return post;
      }
    });
  }

  static _sortByPopularity(posts) {
    return posts.sort((a, b) => {
      return a.note_count > b.note_count ? 1 : (a.note_count < b.note_count ? -1 : 0);
    }).reverse();
    return posts;
  }

  static _filterNSFW(query, posts) {
    return posts.filter(post => {
      if (!post.hasOwnProperty('tumblelog-content-rating')) {
        return post;
      }
    });
  }

  static _filterOriginal(query, posts) {
    return posts.filter(post => {
      if (!post.is_reblog) {
        return post;
      }
    });
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
    console.log('[SEARCH LIKES]', query);
    return query;
  }

  static async searchLikesByTag(query) {
    query = Likes._marshalQuery(query);
    const deferred = Deferred();
    try {
      let matches = [];
      // Note: wrong
      if (query.post_type !== 'any' && query.term.length === 0) {
        matches = await db.posts.where('type').equals(query.post_type).limit(LIMIT).reverse().toArray(); // return all of a certain type
      } else if (query.post_type !== 'any' && query.term.length > 0) {
        matches = await db.posts.where('tags').anyOfIgnoreCase(query.term).or('type').equals(query.post_type).limit(LIMIT).reverse().toArray();
      } else if (query.post_type === 'any' && query.term.length === 0) {
        matches = await db.posts.toCollection().limit(LIMIT).reverse().toArray(); // dangerous, why not just query from the likes page
      } else if (query.post_type === 'any' && query.term.length > 0) {
        matches = await db.posts.where('tags').anyOfIgnoreCase(query.term).limit(LIMIT).reverse().toArray();
      }
      if (query.sort === 'POPULARITY_DESC') {
        Likes._sortByPopularity(matches);
      }
      if (query.before) {
        matches = Likes._filterByDate(query, matches);
      }
      if (query.filter_nsfw) {
        matches = Likes._filterNSFW(query, matches);
      }
      if (query.post_role === 'ORIGINAL') {
        matches = Likes._filterOriginal(query, matches);
      }
      if (query.offset && query.limit) {
        const { offset, limit } = query;
        matches = matches.slice(offset, offset + limit);
      }
      console.log(matches);
      deferred.resolve(matches);
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static async update(request) {
    console.log(request);
    const { type, postId } = request.payload;
    if (type === 'like') {
      const posts = await Source.fetchMostRecent();
      const post = posts[findIndex(posts, { id: postId })];
      await db.posts.put(post);
      const count = await db.posts.toCollection().count();
      constants.set('cachedPostsCount', count);
      console.log('[ADDED LIKE]', count);
    } else {
      await db.posts.delete(postId);
      console.log('[REMOVED LIKE]');
    }
  }
}
