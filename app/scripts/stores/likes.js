import { ajax } from 'jquery';
import async from 'async';
import { debounce, differenceBy } from 'lodash';
import Dexie, { spawn } from 'dexie';
import db from '../lib/db';
import { log } from '../utils/loggingUtil';
import constants, { CONSUMER_KEY } from '../constants';
import 'babel-polyfill';

export default class Likes {
  static fetchLikedPosts(slug, callback) {
    console.log('[SLUG]', slug);
    const data = {
      api_key: constants.consumerKey || CONSUMER_KEY,
      limit: slug.limit || 8
    };
    Object.assign(data, slug);
    ajax({
      type: 'GET',
      url: `https://api.tumblr.com/v2/blog/${slug.blogname}.tumblr.com/likes`,
      data,
      success: data => {
        callback(data.response);
      },
      fail: error => {
        console.error('[FAIL]', error);
        callback(error);
      }
    });
  }

  static initialSyncLikes(posts) {
    if (!posts || posts.length === 0) {
      return;
    }
    const slug = {
      blogname: constants.userName,
      offset: 0,
      limit: 50
    };
    const callback = response => {
      posts.toArray(items => {
        const difference = differenceBy(response.liked_posts, items, 'id');
        if (difference.length !== 0) {
          console.log('[ADDING NEW LIKES]', difference);
          posts.bulkPut(difference);
        }
        console.log('[SYNC DONE]');
      });
    };
    console.log('[SYNCING LIKES]');
    this.fetchLikedPosts(slug, callback);
  }

  static preloadLikes(callback) {
    spawn(function *() {
      const count = yield db.posts.toCollection().count();
      console.log('[PRELOADING LIKES]');
      const slug = {
        blogname: constants.userName,
        limit: 50
      };
      // fetch farthest back cached like
      if (count !== 0) {
        const posts = yield db.posts.orderBy('liked_timestamp').limit(1).toArray();
        slug.before = posts[0].liked_timestamp;
      }
      this.populatePostCache(slug, constants, count, callback);
    });
  }

  static populatePostCache(slug, items, postCount, callback) {
    console.log('[ITEMS] called', arguments);
    async.whilst(() => {
      return items.totalPostsCount === 0 || items.totalPostsCount > postCount;
    }, next => {
      debounce(this.fetchLikedPosts, 0).call(this, slug, response => {
        if (response.liked_posts.length > 0) {
          items.total = response.liked_count;
          slug.before = response.liked_posts[response.liked_posts.length - 1].liked_timestamp;
          const transaction = db.posts.bulkPut(response.liked_posts);
          transaction.then(() => {
            log('posts', postCount, items, response => {
              next(null);
              callback(response);
            });
          });
          transaction.catch(Dexie.BulkError, error => {
            console.log('[DB]', error.message);
            log('posts', postCount, items, response => {
              next(null);
              callback(response);
            });
          });
        } else {
          console.log('[RESPONSE EMPTY. DONE CACHING]');
          log('posts', postCount, items, response => {
            callback(response);
          });
        }
      });
    }, error => {
      console.error(error);
    });
  }

  // TODO: refactor to make use of indexeddb methods
  static searchLikes(args, callback) {
    console.log('[SEARCH LIKES]', args);
    const term = (typeof args === 'string' ? args : args.term);
    spawn(function *() {
      const posts = yield db.posts.toCollection().toArray();
      let matches = posts;
      if (term !== '') {
        matches = matches.filter(post => {
          if (post.tags.indexOf(term) > -1) {
            return post;
          }
        });
      }
      if (args.post_type && args.post_type !== 'ANY') {
        const type = args.post_type.toLowerCase();
        matches = matches.filter(post => {
          if (post.type === type) {
            return post;
          }
        });
      }
      if (args.sort && args.sort === 'CREATED_DESC') {
        matches = matches.sort((a, b) => {
          return a.timestamp - b.timestamp;
        }).reverse();
      } else if (args.sort && args.sort === 'POPULARITY_DESC') {
        matches = matches.sort((a, b) => {
          return a.note_count > b.note_count ? 1 : (a.note_count < b.note_count ? -1 : 0);
        }).reverse();
      }
      if (args.before) {
        matches = matches.filter(post => {
          console.log('[LIKED]', new Date(post.liked_timestamp * 1000), post.liked_timestamp < args.before);
          if (post.liked_timestamp < args.before) {
            return post;
          }
        });
      }
      console.log('[MATCHES]', matches);
      if (args.offset && args.limit) {
        const { offset, limit } = args;
        matches = matches.slice(offset, offset + limit);
        return callback(matches);
      }
      return callback(matches);
    });
  }

  static syncLikes(payload) {
    console.log(payload);
    const { action, postId } = payload;
    if (action === 'like') {
      const slug = {
        blogname: constants.userName,
        offset: 0,
        limit: 1
      };
      this.fetchLikedPosts(slug, response => {
        db.posts.toCollection().count(count => {
          db.posts.add(response.liked_posts[0]);
          console.log('[ADDED LIKE]', count);
        });
      });
    } else {
      db.posts.delete(postId).then(() => {
        console.log('[REMOVED LIKE]');
      });
    }
  }
}
