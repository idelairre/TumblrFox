/* global chrome:true */
/* eslint no-undef: "error" */

import $, { ajax, Deferred } from 'jquery';
import async from 'async';
import { differenceBy, isEmpty } from 'lodash';
import db from '../lib/db';
import { log } from '../utils/loggingUtil';
import constants from '../constants';
import 'babel-polyfill';

Object.defineProperty(Object.prototype, 'renameProperty', {
  writable: false,
  enumerable: false,
  configurable: false,
  value(oldName, newName) {
    if (oldName === newName) {
      return this;
    }
    if (this.hasOwnProperty(oldName)) {
      this[newName] = this[oldName];
      delete this[oldName];
    }
    return this;
  }
});

export default class Likes {
  static testFetchLikedPosts(slug) {
    const deferred = Deferred();
    let url = 'https://www.tumblr.com/likes';
    if (slug && slug.page) {
      url += `/page/${slug.page}`;
    }
    if (slug && slug.timestamp) {
      url += `/${slug.timestamp}`;
    }
    ajax({
      type: 'GET',
      url,
      success: data => {
        deferred.resolve(data);
      },
      error: error => {
        console.error('[FAIL]', error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  static testProcessTags(post) {
    const tagElems = $(post).find('.post_tags');
    if (tagElems && tagElems.length > 0) {
      const rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#').filter(tag => {
        if (tag === '') {
          return;
        }
        return tag;
      });
      return rawTags;
    }
  }

  static testProcessPosts(slug, data) {
    const deferred = Deferred();
    try {
      const postsJson = [];
      let next = $(data).find('#pagination').find('a#next_page_link').attr('href').split('/');
      next = next[next.length - 1];
      if (slug.hasOwnProperty('page')) {
        slug.page += 1;
      } else {
        slug.page = 1;
      }
      slug.timestamp = next;
      console.log('[FETCHING BEFORE]', new Date(next * 1000));
      const posts = $(data).find('[data-json]');
      posts.each(function () {
        const post = $(this).data('json');
        post.id = parseInt(post.id, 10);
        post.html = $(this).prop('outerHTML');
        post.liked_timestamp = parseInt(slug.timestamp, 10);
        post.tags = Likes.testProcessTags(this) || [];
        post.note_count = $(this).find('.note_link_current').data('count') || 0;
        post.blog_name = post.tumblelog;
        if (post.id) {
          postsJson.push(post);
        }
      });
      const nextSlug = slug;
      chrome.storage.local.set({ nextSlug });
      deferred.resolve({ nextSlug, postsJson });
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static async testPreloadLikes(port) {
    const items = {
      cachedPostsCount: constants.cachedPostsCount,
      totalPostsCount: constants.totalPostsCount
    };
    const slug = {
      blogname: constants.userName
    };
    chrome.storage.local.set({
      totalPostsCount: constants.totalPostsCount
    });
    if (!isEmpty(constants.nextSlug)) {
      Object.assign(slug, constants.nextSlug);
    }
    console.log(constants);
    this.testPopulatePostCache(slug, items, port);
  }

  static testPopulatePostCache(slug, items, port) {
    async.whilst(() => {
      return items.totalPostsCount > items.cachedPostsCount;
    }, async next => {
      try {
        const data = await this.testFetchLikedPosts(slug);
        const { nextSlug, postsJson } = await this.testProcessPosts(slug, data);
        items.cachedPostsCount += postsJson.length;
        slug = nextSlug;
        await db.posts.bulkPut(postsJson);
        log('posts', items, response => {
          port(response);
          next(null);
        });
      } catch (e) {
        console.error(e);
        port({ error: `${e}`});
        next(e);
      }
    });
  }

  static async checkLikes() {
    const deferred = Deferred();
    ajax({
      type: 'GET',
      url: `https://www.tumblr.com/liked/by/${constants.userName}`,
      success: () => {
        deferred.resolve(true);
      },
      error: error => {
        deferred.resolve(false, error);
      }
    });
    return deferred.promise();
  }

  static async initialSyncLikes() {
    console.log('[SYNCING LIKES]');
    const deferred = Deferred();
    let slug = {};
    if (constants.clientCaching) {
      // do nothing
    } else {
      slug = {
        blogname: constants.userName,
        offset: 0,
        limit: 8
      };
    }
    const callback = async (slug, response) => {
      const posts = await db.posts.toCollection().toArray();
      let difference = {};
      if (constants.clientCaching) {
        const { nextSlug, postsJson } = await this.testProcessPosts(slug, response);
        slug = nextSlug;
        difference = differenceBy(postsJson, posts, 'id');
      } else {
        slug.offset += response.liked_posts.length;
        difference = differenceBy(response.liked_posts, posts, 'id');
      }
      if (difference.length !== 0) {
        console.log('[ADDING NEW LIKES]', difference);
        await db.posts.bulkPut(difference);
      } else {
        const count = await db.posts.toCollection().count();
        deferred.resolve(count);
      }
      console.log('[SYNC DONE]');
    };
    try {
      if (constants.clientCaching) {
        let response = await this.testFetchLikedPosts(slug);
        callback(slug, response);
      } else {
        let response = await this.fetchLikedPosts(slug);
        callback(slug, response);
      }
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static fetchLikedPosts(slug) {
    const deferred = Deferred();
    const data = {
      api_key: constants.consumerKey,
      limit: slug.limit || 8
    };
    Object.assign(data, slug);
    ajax({
      type: 'GET',
      url: `https://api.tumblr.com/v2/blog/${slug.blogname}.tumblr.com/likes`,
      data,
      success: data => {
        if (data.response.liked_posts.length === 0) {
          deferred.reject(new Error('Response was empty'));
        } else {
          deferred.resolve(data.response);
        }
      },
      error: error => {
        console.error('[ERROR]', error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  static async preloadLikes(callback) {
    console.log('[PRELOADING LIKES]');
    const slug = {
      blogname: constants.userName,
      limit: 50
    };
    // fetch farthest back cached like
    if (constants.cachedPostsCount !== 0) {
      const posts = await db.posts.orderBy('liked_timestamp').limit(1).toArray();
      slug.before = posts[0].liked_timestamp;
    }
    this.populatePostCache(slug, constants, callback);
  }

  static populatePostCache(slug, items, port) {
    async.whilst(() => {
      return items.totalPostsCount > items.cachedPostsCount;
    }, async next => {
      try {
        const response = await this.fetchLikedPosts(slug);
        items.totalPostsCount = response.liked_count;
        slug.before = response.liked_posts[response.liked_posts.length - 1].liked_timestamp;
        await db.posts.bulkPut(response.liked_posts);
        items.cachedPostsCount += response.liked_posts.length;
        log('posts', items, data => {
          port(data);
        });
        next(null);
      } catch (e) {
        port({ error: `${e}` });
        next(e);
      }
    });
  }

  static async getLikesByTag(args) {
    const deferred = Deferred();
    try {
      const matches = await db.posts.where('tags').anyOfIgnoreCase(args.term).reverse().toArray();
      return deferred.resolve(matches);
    } catch (e) {
      console.error(e);
      return deferred.reject(e);
    }
  }

  static async getLikesByType(type) {
    await db.posts.where('type').anyOfIgnoreCase(type).toArray();
  }

  static async filterByDate(args, posts) {
    const deferred = Deferred();
    const date = args.before / 1000;
    posts = posts.filter(post => {
      if (date >= post.liked_timestamp) {
        return post;
      }
    });
    return deferred.resolve(posts);
  }

  static filterByType(args, posts) {
    const deferred = Deferred();
    const type = args.post_type.toLowerCase();
    posts = posts.filter(post => {
      if (post.type === type) {
        return post;
      }
    });
    return deferred.resolve(posts);
  }

  static sortByPopularity(posts) {
    const deferred = Deferred();
    posts = posts.sort((a, b) => {
      return a.note_count > b.note_count ? 1 : (a.note_count < b.note_count ? -1 : 0);
    }).reverse();
    return deferred.resolve(posts);
  }

  static async searchLikes(args, port) {
    console.log('[SEARCH LIKES]', args);
    const term = (typeof args === 'string' ? args : args.term);
    let matches = [];
    if (term.length > 0) {
      matches = await this.getLikesByTag(args);
    } else {
      matches = await db.posts.orderBy('tags').reverse().toArray(); // return all
    }
    if (args.sort === 'POPULARITY_DESC') {
      await this.sortByPopularity(matches);
    }
    if (args.post_type !== 'ANY') {
      matches = await this.filterByType(args, matches);
    }
    if (args.before) {
      matches = await this.filterByDate(args, matches);
    }
    if (args.offset && args.limit) {
      const { offset, limit } = args;
      matches = matches.slice(offset, offset + limit);
      return port(matches);
    }
    return port(matches);
  }

  static async syncLikes(payload) {
    // console.log(payload);
    const { action, postId } = payload;
    if (action === 'like') {
      const slug = {
        blogname: constants.userName,
        offset: 0,
        limit: 1
      };
      const response = await this.fetchLikedPosts(slug);
      const count = await db.posts.toCollection().count();
      db.posts.add(response.liked_posts[0]);
      console.log('[ADDED LIKE]', count);
    } else {
      await db.posts.delete(postId);
      console.log('[REMOVED LIKE]');
    }
  }
}
