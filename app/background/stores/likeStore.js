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

  static setFilter(query) {
    let matches = FuseSearch.getMatches();
    matches = Likes._applyFilters(query, matches);
    FuseSearch.setMatches(matches);
  }

  static async _fuseSearch(query) {
    try {
    if (query.post_type.blogname && query.post_type.blogname !== '' && query.post_type !== 'any') {
      const filterByBlog = post => {
        return post.blog_name.toLowerCase() === query.blogname.toLowerCase();
      }
      const posts = await db.posts.where('type').equals(query.post_type).and(filterByBlog).toArray();
      FuseSearch.setCollection(posts);
    } else if (query.blogname && query.blogname !== '' && query.post_type === 'any') {
      const posts = await db.posts.where('blog_name').anyOfIgnoreCase(query.blogname).toArray();
      FuseSearch.setCollection(posts);
    } else if (query.post_type !== 'any') {
        const posts = await db.posts.where('type').equals(query.post_type).limit(LIMIT).reverse().toArray();
        FuseSearch.setCollection(posts);
      } else {
        const posts = await db.posts.toCollection().limit(LIMIT).reverse().toArray();
        FuseSearch.setCollection(posts);
      }
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
      if (post.type === type) {
        return post;
      }
    });
  }

  static _sortByPopularity(posts) {
    return posts.sort((a, b) => {
      return a.note_count > b.note_count ? 1 : (a.note_count < b.note_count ? -1 : 0);
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

  static async searchLikesByTag(query) {
    query = Likes._marshalQuery(query);
    const deferred = Deferred();
    try {
      let matches = [];
      if (query.post_type.blogname && query.post_type.blogname !== '' && query.post_type !== 'any') {
        const filterByBlog = post => {
          return post.blog_name.toLowerCase() === query.blogname.toLowerCase();
        }
        matches = await db.posts.where('type').equals(query.post_type).and(filterByBlog).toArray();
      } else if (query.blogname && query.blogname !== '' && query.post_type === 'any') {
        matches = await db.posts.where('blog_name').anyOfIgnoreCase(query.blogname).toArray();
      } else if (query.post_type !== 'any' && query.term.length === 0) {
        matches = await db.posts.where('type').equals(query.post_type).limit(LIMIT).reverse().toArray(); // return all of a certain type
      } else if (query.post_type !== 'any' && query.term.length > 0) {
        const filterType = item => {
          if (item.type) {
            return item.type.toLowerCase() === query.post_type.toLowerCase();
          }
        }
        matches = await db.posts.where('tags').anyOfIgnoreCase(query.term).limit(LIMIT).filter(filterType).reverse().toArray();
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
      const { next_offset, limit } = query;
      matches = matches.slice(next_offset, next_offset + limit);
      deferred.resolve(matches);
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static async syncLike(request) {
    const { postId, html } = request;
    const postData = $(html).find('[data-json]').data('json');
    console.log(postData);
    // await Likes.put()
  }

  static async updateLikes(request) {
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
