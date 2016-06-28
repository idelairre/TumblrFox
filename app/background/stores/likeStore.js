/* global Promise:true */
/* eslint no-undef: "error" */

import $, { ajax, Deferred } from 'jquery';
import async from 'async';
import { differenceBy, findIndex, first, isString } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import { log, logError } from '../services/loggingService';
import Tags from './tagStore';
import FuseSearch from '../services/fuseSearchService';
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

  static async put(post) {
    try {
      post = await Likes._updateTags(post);
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

  static _applyFilters(query, matches) {
    if (query.post_type !== 'any') {
      matches = Likes._filterByType(query, matches);
    }
    if (query.post_role) {
      matches = Likes._filterOriginal(query, matches);
    }
    if (query.filter_nsfw) {
      matches = Likes._filterNSFW(query, matches);
    }
    if (query.before) {
      matches = Likes._filterByDate(query, matches);
    }
    if (query.sort === 'POPULARITY_DESC') {
      matches = Likes._sortByPopularity(matches);
    }
    return matches;
  }

  static setFilter(query) {
    let matches = FuseSearch.getMatches();
    matches = Likes._applyFilters(query, matches);
    FuseSearch.setMatches(matches);
  }

  static async _fuseSearch(query) {
    console.log(query);
    try {
      let posts = {};
      if (query.post_type.blogname && query.post_type.blogname !== '' && query.post_type !== 'any') {
        const filterByBlog = post => {
          return post.blog_name.toLowerCase() === query.blogname.toLowerCase();
        }
        posts = await db.posts.where('type').anyOfIgnoreCase(query.post_type).and(filterByBlog).reverse().toArray();
      } else if (query.blogname && query.blogname !== '' && query.post_type === 'any') {
        posts = await db.posts.where('blog_name').anyOfIgnoreCase(query.blogname).reverse().toArray();
      } else if (query.post_type !== 'any') {
        posts = await db.posts.where('type').anyOfIgnoreCase(query.post_type).limit(LIMIT).toArray();
      } else {
        posts = await db.posts.toCollection().limit(LIMIT).reverse().toArray();
      }
      FuseSearch.setCollection(posts);
      let matches = await FuseSearch.search(query);
      matches = Likes._applyFilters(query, matches);
      FuseSearch.setMatches(matches);
      return matches.slice(0, query.limit);
    } catch (e) {
      console.error(e);
    }
  }

  static async searchLikesByTerm(query) {
    const deferred = Deferred();
    try {
      query = Likes._marshalQuery(query);
      if (query.next_offset !== 0) {
        return deferred.resolve(FuseSearch.fetchMatches(query));
      }
      const matches = await Likes._fuseSearch(query);
      deferred.resolve(matches);
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
      if (post.type.includes(type)) {
        return post;
      }
    });
  }

  static _sortByPopularity(posts) {
    return posts.sort((a, b) => {
      return a.note_count - b.note_count;
    }).reverse();
  }

  static _filterNSFW(query, posts) {
    return posts.filter(post => {
      if (post.hasOwnProperty('tumblelog-content-rating') && post['tumblelog-content-rating'] === 'nsfw' || post['tumblelog-content-rating'] === 'adult') {
        return;
      }
      return post;
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
    return query;
  }

  static async searchLikesByTag(query) { // NOTE: this is a mess, refactor using dexie filters, try to share code with FuseSearch
    console.log(query);
    query = Likes._marshalQuery(query);
    const deferred = Deferred();
    const filterType = item => {
      if (query.post_type === 'any') {
        return item;
      }
      if (item.type) {
        return item.type.toLowerCase().includes(query.post_type.toLowerCase());
      }
    }
    try {
      let matches = [];
      if (query.blogname && query.blogname !== '') {
        matches = await db.posts.where('blog_name').anyOfIgnoreCase(query.blogname).filter(filterType).toArray();
      } else if (query.post_type !== 'any' && query.term.length === 0) {
        matches = await db.posts.where('type').anyOfIgnoreCase(query.post_type).reverse().toArray();
      } else if (query.post_type !== 'any' && query.term.length > 0) {
        matches = await db.posts.where('tags').anyOfIgnoreCase(query.term).filter(filterType).reverse().toArray();
      } else if (query.post_type === 'any' && query.term.length === 0) {
        matches = await db.posts.toCollection().limit(LIMIT).reverse().toArray();
      } else if (query.post_type === 'any' && query.term.length > 0) {
        matches = await db.posts.where('tags').anyOfIgnoreCase(query.term).reverse().toArray();
      }
      if (matches.length && matches.length > 0) {
        matches = Likes._applyFilters(query, matches);
        const { next_offset, limit } = query;
        matches = matches.slice(next_offset, next_offset + limit);
        deferred.resolve(matches);
      } else {
        deferred.resolve([]);
      }
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static async syncLike(postData) {
    postData.tags = Source.processTags(postData.html);
    Likes.put(postData);
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

  static async _updateTags(post) {
    if (typeof post.tags === 'string') {
      post.tags = JSON.parse(post.tags) || [];
    } else if (typeof post.tags === 'undefined') {
      post.tags = [];
    }
    if (post.tags.length > 0) {
      await Tags.add(post.tags);
    }
    return post;
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
