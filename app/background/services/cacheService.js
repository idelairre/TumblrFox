import { capitalize, isFunction, invoke, maxBy, union } from 'lodash';
import { Deferred } from 'jquery';
import async from 'async';
import Dexie from 'dexie';
import Papa from '../lib/papaParse';
import { logValues, logError, calculatePercent } from './loggingService';
import constants from '../constants';
import db from '../lib/db';
import Firebase from './firebaseService';
import Likes from '../stores/likeStore';
import Lunr from '../services/lunrSearchService';
import Tags from '../stores/tagStore';
import 'babel-polyfill';

const Promise = Dexie.Promise;

export default class Cache {
  static updateTokens(table) {
    if (table !== 'posts' && table !== 'likes') {
      throw new Error(`${table} is not a valid table. Can only update tables containing posts`);
    }
    Cache.asyncOp(table, 'put', async post => {
      post.tokens = Lunr.tokenizeHtml(post.html);
      post.tokens = union(post.tags, post.tokens, [post.blog_name]);
      return await db[table].put(post);
    }).then(() => {
      console.log('[ASYNCOP] update following from likes complete');
    }).catch(err => {
      console.error(err);
    });
  }

  static updateFollowingFromLikes() {
    Cache.asyncOp('likes', 'put', async post => {
      if (post['tumblelog-data'].following) {
        const following = await db.following.get(post['tumblelog-data'].name);
        if (!following) {
          return db.following.put(post['tumblelog-data']);
        }
      }
    }).then(() => {
      console.log('[ASYNCOP] update following from likes complete');
    }).catch(err => {
      console.error(err);
    });
  }

  static async rehashTags(sendResponse) {
    await Cache.resetTags();
    Cache.asyncOp('likes', 'put', async post => {
      await Tags._updateTags(post);
    }, async () => {
      const count = await db.tags.toCollection().count();
      constants.set('cachedTagsCount', count);
    }, sendResponse).then(() => {
      console.log('[ASYNCOP] rehash tags complete');
    }).catch(err => {
      console.error(err);
    });
  }

  static async asyncOp(table, operation, func, cb, sendResponse) {
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
        if (operation.match(/bulkDelete/)) {
          const _items = items.map(item => {
            return item[primaryKey];
          });
          await db[table][operation](_items);
        } else if (operation.match(/bulk/)) {
          if (func) {
            items.map(func);
          }
          await db[table][operation](items);
        } else {
          const promises = items.map(async item => {
            if (operation.match(/delete/)) {
              await db[table][operation](item[primaryKey]);
            } else {
              if (func) {
                items.map(func);
              }
              await db[table][operation](item);
            }
          });
          await Promise.all(promises);
        }
        count = await db[table].toCollection().count();
        console.log(`cached${capitalize(table)}Count`);
        constants.set(`cached${capitalize(table)}Count`, count);
        if (cb) {
          if (cb instanceof Promise) {
            await cb();
          } else {
            cb();
          }
        }
        const { percentComplete, itemsLeft, total } = calculatePercent(offset, count);
        console.log('[ASYNCOP]', `%${percentComplete}`);
        if (sendResponse) {
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
        next(null, items.length);
      } catch (e) {
        if (sendResponse) {
          logError(e, next, sendResponse);
        } else {
          next(e);
        }
      }
    }, next => {
      return next !== 0;
    }, error => {
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
      const posts = await db.likes.toCollection().toArray();
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
    constants.reset('cachedPostsCount');
    constants.reset('nextBlogSourceSlug');
  }

  static async resetFollowing() {
    await db.following.toCollection().delete();
    constants.reset('cachedFollowingCount');
  }

  static async resetLikes() {
    await db.likes.toCollection().delete();
    constants.reset('cachedLikesCount');
    constants.reset('nextLikeSourceSlug');
  }

  static async resetTags() {
    await db.tags.toCollection().delete();
    constants.reset('cachedTagsCount');
  }

  static async reset(table, sendResponse) {
    try {
      sendResponse({
        type: 'deleting',
      });
      constants.once('reset', () => {
        sendResponse({
          type: 'done',
          message: table === 'all' ? 'Cache reset' : `${capitalize(table)} cache reset`,
          payload: {
            constants: constants.toJSON()
          }
        });
      });
      if (table === 'all') {
        await Cache.resetLikes();
        await Cache.resetFollowing();
        await Cache.resetPosts();
        await Cache.resetTags();
      } else {
        await Cache[`reset${capitalize(table)}`]();
      }
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
        sendResponse({
          type: 'progress',
          payload: calculatePercent(cachedCount, totalCount)
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
      sendResponse({
        type: 'progress',
        payload: calculatePercent(offset, fileSize)
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
        logValues('posts', sendResponse);
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
