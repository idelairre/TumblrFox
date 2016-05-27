/* global Promise:true */
/* global alert:true */
/* eslint no-undef: "error" */

import $, { ajax, Deferred } from 'jquery';
import async from 'async';
import { differenceBy, isString } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import { log } from '../services/logging';
import Tags from './tagStore';
import Keys from './keyStore';
import 'babel-polyfill';

const escapeQuotes = string => {
  return string.replace(/"/g, '\\"');
}

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

  static _testProcessTags(post) {
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

  static _testProcessPost(postHtml, timestamp) {
    const post = $(postHtml).data('json');
    post.id = parseInt(post.id, 10);
    post.html = $(postHtml).prop('outerHTML') //.replace(/"/g, '\\\"');
    post.liked_timestamp = parseInt(timestamp, 10);
    post.tags = Likes._testProcessTags(postHtml) || [];
    post.note_count = $(postHtml).find('.note_link_current').data('count') || 0;
    post.blog_name = post.tumblelog;
    return post;
  }

  static _testProcessPosts(slug, data) {
    const deferred = Deferred();
    try {
      const postsJson = [];
      let next = $(data).find('#pagination').find('a#next_page_link').attr('href').split('/');
      next = next[next.length - 1];
      slug.timestamp = next;
      if (slug.hasOwnProperty('page')) {
        slug.page += 1;
      } else {
        slug.page = 1;
      }
      console.log('[FETCHING BEFORE]', new Date(next * 1000));
      const posts = $(data).find('[data-json]');
      posts.each(function () {
        const post = Likes._testProcessPost(this, slug.timestamp);
        if (post.id) {
          postsJson.push(post);
        }
      });
      const nextSlug = slug;
      deferred.resolve({
        nextSlug,
        postsJson
      });
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static async testPreload(port) {
    const items = {
      cachedPostsCount: constants.get('cachedPostsCount'),
      totalPostsCount: constants.get('totalPostsCount')
    };
    const slug = {
      blogname: constants.get('userName')
    };
    if (constants.get('nextSlug')) {
      Object.assign(slug, constants.get('nextSlug'));
    }
    this.testPopulatePostCache(slug, items, port);
  }

  static testPopulatePostCache(slug, items, port) {
    async.whilst(() => {
      return items.totalPostsCount > items.cachedPostsCount;
    }, async next => {
      try {
        const data = await Likes.testFetchLikedPosts(slug);
        const { nextSlug, postsJson } = await Likes._testProcessPosts(slug, data);
        items.cachedPostsCount = await db.posts.toCollection().count();
        constants.set('nextSlug', nextSlug);
        slug = nextSlug;
        await Likes.bulkPut(postsJson);
        log('posts', items, response => {
          port(response);
          next(null);
        });
      } catch (e) {
        console.error(e);
        port({
          action: 'error',
          payload: e
        });
        next(e);
      }
    });
  }

  static async put(post) {
    await db.posts.put(post);
    if (post.tags.length > 0) {
      await Tags.add(post.tags);
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

  static async check(userName) {
    const deferred = Deferred();
    ajax({
      type: 'GET',
      url: `https://www.tumblr.com/liked/by/${userName}`,
      success: () => {
        deferred.resolve(true);
      },
      error: error => {
        deferred.resolve(false, error);
      }
    });
    return deferred.promise();
  }

  static async initialsync(userName) {
    console.log('[SYNCING LIKES]');
    const deferred = Deferred();
    let slug = {};
    if (constants.get('clientCaching')) {
      // do nothing
    } else {
      slug = {
        blogname: constants.get('userName') || userName,
        offset: 0,
        limit: 8
      };
    }
    const callback = async (slug, response) => {
      const posts = await db.posts.toCollection().toArray();
      let difference = {};
      if (constants.get('clientCaching')) {
        const { nextSlug, postsJson } = await Likes._testProcessPosts(slug, response);
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
      if (constants.get('clientCaching')) {
        const response = await Likes.testFetchLikedPosts(slug);
        callback(slug, response);
      } else {
        const response = await Likes.fetchLikedPosts(slug);
        callback(slug, response);
      }
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static fetch(slug) {
    const deferred = Deferred();
    const data = {
      api_key: constants.get('consumerKey'),
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

  static async preload(callback) {
    console.log('[PRELOADING LIKES]');
    const slug = {
      blogname: constants.get('userName'),
      limit: 1
    };
    // fetch farthest back cached like
    if (constants.get('cachedPostsCount') !== 0) {
      const posts = await db.posts.orderBy('liked_timestamp').limit(1).toArray();
      slug.before = posts[0].liked_timestamp;
    }
    this.populatePostCache(slug, constants, callback);
  }

  static populatePostCache(slug, items, port) {
    async.whilst(() => {
      return items.totalPostsCount === 0 || items.totalPostsCount > items.cachedPostsCount;
    }, async next => {
      try {
        const response = await Likes.fetch(slug);
        items.totalPostsCount = response.liked_count;
        slug.before = response.liked_posts[response.liked_posts.length - 1].liked_timestamp;
        await Likes.bulkPut(response.liked_posts);
        items.cachedPostsCount += response.liked_posts.length;
        log('posts', items, data => {
          port(data);
        });
        next(null);
      } catch (e) {
        console.error(e);
        port({
          action: 'error',
          payload: e
        });
        next(e);
      }
    });
  }

  static async searchByTerm(query, port) {
    try {
      const results = await Keys.search(query);
      port(results);
    } catch (e) {
      console.error(e);
      port(e);
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

  static async searchByTag(args, port) {
    console.log('[SEARCH LIKES]', args);
    const term = (typeof args === 'string' ? args : args.term);
    let matches = [];
    if (term.length > 0) {
      matches = await Likes._getLikesByTag(args);
    } else {
      matches = await db.posts.orderBy('tags').reverse().toArray(); // return all
    }
    if (args.sort === 'POPULARITY_DESC') {
      await Likes._sortByPopularity(matches);
    }
    if (args.post_type !== 'ANY') {
      matches = await Likes._filterByType(args, matches);
    }
    if (args.before) {
      matches = await Likes._filterByDate(args, matches);
    }
    if (args.offset && args.limit) {
      const { offset, limit } = args;
      matches = matches.slice(offset, offset + limit);
      return port(matches);
    }
    return port(matches);
  }

  static async sync(payload) {
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

  static async update(payload) {
    const { action, html, postId, timestamp } = payload;
    if (action === 'like') {
      const postData = Likes._testProcessPost(html, timestamp);
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
