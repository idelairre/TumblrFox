import async from 'async';
import { capitalize, invoke, maxBy, union } from 'lodash';
import Dexie from 'dexie';
import Papa from '../lib/papaParse';
import constants from '../constants';
import { logValues, logError, calculatePercent } from './loggingService';
import db from '../lib/db';
import Firebase from './firebaseService';
import Likes from '../stores/likeStore';
import Lunr from '../services/lunrSearchService';
import Tags from '../stores/tagStore';
import { Deferred } from 'jquery';
import 'babel-polyfill';

const Promise = Dexie.Promise;

export default class Cache {
  static async updateTokens(table) {
    if (table !== 'posts' && table !== 'likes') {
      throw new Error(`${table} is not a valid table. Can only update tables containing posts`);
    }
    let offset = 0;
    let count = await db[table].toCollection().count();
    async.doWhilst(async next => {
      try {
        const posts = await db[table].toCollection().offset(offset).limit(100).toArray();
        offset += posts.length;
        if (posts.length > 0) {
          const promises = posts.map(async post => {
            post.tokens = Lunr.tokenizeHtml(post.html);
            post.tokens = union(post.tags, post.tokens, [post.blog_name]);
            return await db[table].put(post);
          });
          await Promise.all(promises);
        }
        next(null, posts.length);
      } catch (e) {
        next(e);
      }
    }, next => {
      return next !== 0;
    }, error => {
      if (error) {
        console.error(error);
      }
      console.log('done updating tokens');
    });
  }

  static async updateNotes() {
    let offset = 0;
    async.doWhilst(async next => {
      try {
        const posts = await db.posts.toCollection().filter(post => {
          return !post.note_count;
        }).offset(offset).limit(100).toArray();
        offset += posts.length;
        if (posts.length > 0) {
          const promises = posts.map(async post => {
            post.note_count = post.notes.count;
            return await db.posts.put(post);
          });
          await Promise.all(promises);
        }
        next(null, posts.length);
      } catch (e) {
        next(e);
      }
    }, next => {
      return next !== 0;
    });
  }

  static async updateFollowingFromLikes() {
    let offset = 0;
    let count = await db.following.toCollection().count();
    async.doWhilst(async next => {
      try {
        const posts = await db.likes.toCollection().offset(offset).limit(100).toArray();
        offset += posts.length;
        const promises = posts.filter(async post => {
          if (post['tumblelog-data'].following) {
            const following = await db.following.get(post['tumblelog-data'].name);
            if (!following) {
              return db.following.put(post['tumblelog-data']);
            }
          }
        });
        count = await db.following.toCollection().count();
        constants.set('cachedFollowingCount', count);
        await Promise.all(promises);
        next(null, posts.length);
      } catch (e) {
        next(e);
      }
    }, next => {
      return next !== 0;
    });
  }

  static async rehashTags(sendResponse) {
    await Cache.resetTags();
    let offset = 0;
    let count = await db.likes.toCollection().count();
    async.doWhilst(async next => {
      try {
        const posts = await db.likes.toCollection().offset(offset).limit(100).toArray();
        offset += posts.length;
        if (posts.length > 0) {
          const promises = posts.map(async post => {
            return await Tags._updateTags(post); // flags to not add tags
          });
          await Promise.all(promises);
        }
        if (typeof sendResponse === 'function') {
          const { percentComplete, itemsLeft, total } = calculatePercent(offset, count);
          const payload = {
            constants,
            percentComplete,
            itemsLeft,
            total
          };
          sendResponse({
            type: 'progress',
            payload
          });
        }
        next(null, posts.length);
      } catch (e) {
        if (typeof sendResponse === 'function') {
          logError(e, next, sendResponse);
        } else {
          next(e);
        }
      }
    }, next => {
      return next !== 0;
    }, error => {
      if (error) {
        console.error(error);
      }
      console.log('done rehashing tags');
    });
  }

  static async asyncOp(table, operation, sendResponse) {
    const deferred = Deferred();
    const primaryKey = db[table].schema.primKey.name;
    let offset = 0;
    let count = await db[table].toCollection().count();
    if (count === 0) {
      deferred.resolve();
    }
    async.doWhilst(async next => {
      try {
        const items = await db[table].toCollection().offset(offset).limit(100).toArray();
        offset += items.length;
        if (operation.includes('bulk')) {
          await invoke(db[table], operation, items.map(item => { // NOTE: this does not work
            return item[primaryKey];
          }));
        } else {
          const promises = items.map(async item => {
            if (operation === 'delete') {
              await invoke(db[table], operation, item[primaryKey]);
            } else {
              await invoke(db[table], operation, item);
            }
            count = await db[table].toCollection().count();
            constants.set(`cached${capitalize(table)}Count`, count);
          });
          await Promise.all(promises);
        }
        if (typeof sendResponse === 'function') {
          logValues(table, sendResponse);
        }
        next(null, items.length);
      } catch (e) {
        next(e);
        if (typeof sendResponse === 'function') {
          logError(e, next, sendResponse);
        }
      }
    }, next => {
      return next !== 0;
    }, (error, next) => {
      if (error) {
        deferred.reject(error);
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise();
  }

  static async assembleCacheAsCsv(sendResponse) { // NOTE: this has problems, throws maximum ipc message at high number of posts
    try {
      const CacheWorker = require('./cacheWorkerService').default;
      const posts = await db.likes.toCollection().limit(100).toArray();
      const file = await CacheWorker.convertJsonToCsv(posts);
      const result = await CacheWorker.assembleFileBlob(file);
      sendResponse({
        type: 'cacheConverted',
        payload: {
          type: 'csv',
          file: result
        }
      });
    } catch (e) {
      logError(e, sendResponse);
    }
  }

  static async resetPosts() {
    await db.posts.toCollection().delete();
    constants.set('cachedPostsCount', 0);
    constants.set('nextBlogSlug', constants.defaults.nextBlogSlug);
    constants.initialize();
  }

  static async resetFollowing() {
    await db.following.toCollection().delete();
    constants.set('cachedFollowingCount', 0);
    constants.initialize();
  }

  static async resetLikes() {
    await db.likes.toCollection().delete();
    constants.set('cachedLikesCount', 0);
    constants.set('likeSourceSlug', constants.defaults.likeSourceSlug);
    constants.initialize();
  }

  static async resetTags() {
    await db.tags.toCollection().delete();
    constants.set('cachedTagsCount', 0);
    constants.initialize();
  }

  static async reset(table, sendResponse) {
    try {
      if (table === 'all') {
        Cache.resetLikes();
        Cache.resetFollowing();
        Cache.resetPosts();
        Cache.resetTags();
        constants.reset();
      } else {
        const method = `reset${capitalize(table)}`;
        await Cache[method]();
      }
      sendResponse({
        type: 'done',
        message: 'Cache reset',
        payload: {
          constants
        }
      });
    } catch (e) {
      logError(e, sendResponse);
    }
  }

  static async uploadCache(sendResponse) {
    const limit = 10;
    const last = await db.likes.toCollection().last();
    const totalCount = await db.likes.toCollection().count();
    let cachedCount = 0;
    let start = await db.likes.toCollection().first();
    async.doWhilst(async next => {
      try {
        const posts = await db.likes.where('id').above(start.id).limit(limit).toArray();
        start = maxBy(posts, 'id');
        await Firebase.bulkPut('likes', posts);
        items.cachedPostsCount += posts.length;
        const progress = calculatePercent(cachedCount, totalCount);
        sendResponse({
          type: 'progress',
          payload: progress
        });
        next(null, start, last);
      } catch (e) {
        logError(e, next, sendResponse);
      }
    }, (start, last) => {
      return start.id !== last.id;
    });
  }

  static async restoreCache(fileSlug, sendResponse) { // this only works for files < 100 mb
    try {
      const CacheWorker = require('./cacheWorkerService').default;
      const { offset, fileSize } = fileSlug;
      const progress = calculatePercent(offset, fileSize);
      sendResponse({
        type: 'progress',
        payload: progress
      });
      const file = await CacheWorker.assembleFile(fileSlug);
      Papa.parse(file, {
        delimiter: 'Ꮂ',
        newline: '',
        header: true,
        dynamicTyping: true,
        worker: false,
        comments: false,
        complete: (results, parse) => {
          Cache._addPostsToDb(results.data, sendResponse);
        },
        error: e => {
          console.error(e);
          logError(e, sendResponse);
        },
        skipEmptyLines: true
      });
    } catch (e) {
      console.error(e);
    }
  }

  static _addPostsToDb(posts, sendResponse) {
    const items = {
      cachedPostsCount: 0,
      totalPostsCount: posts.length - 1
    };
    async.doWhilst(async next => {
      try {
        await Likes.put(posts[items.cachedPostsCount]);
        items.cachedPostsCount += 1;
        log('posts', sendResponse);
        next(null, items.cachedPostsCount);
      } catch (e) {
        logError(e, next, sendResponse);
      }
    }, count => {
      return count !== posts.length - 1;
    });
  }

  static async restoreViaFirebase(sendResponse) {
    try {
       const posts = await Firebase.get('posts', sendResponse);
       Cache._addPostsToDb(posts, sendResponse);
     } catch (e) {
       logError(e, sendResponse);
     }
  }

  static async deleteFirebaseCache(sendResponse) {
    try {
      await Firebase.delete('posts');
    } catch (e) {
      logError(e, sendResponse);
    }
  }
}
