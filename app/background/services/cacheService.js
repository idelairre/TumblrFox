import async from 'async';
import { maxBy } from 'lodash';
import Papa from '../lib/papaParse';
import constants from '../constants';
import { log, logError, calculatePercent } from './loggingService';
import db from '../lib/db';
import Firebase from './firebaseService';
import Likes from '../stores/likeStore';
import 'babel-polyfill';

export default class Cache {
  static async assembleCacheAsCsv(port) { // NOTE: this has problems, throws maximum ipc message at high number of posts
    try {
      const CacheWorker = require('./cacheWorkerService').default;
      const posts = await db.posts.toCollection().limit(100).toArray();
      const file = await CacheWorker.convertJsonToCsv(posts);
      const result = await CacheWorker.assembleFileBlob(file);
      port({
        type: 'cacheConverted',
        payload: {
          type: 'csv',
          file: result
        }
      });
    } catch (e) {
      logError(e, port);
    }
  }

  static async reset(port) {
    try {
      await db.delete();
      constants.reset();
      await db.open();
      port({
        type: 'done',
        message: 'Cache reset',
        payload: {
          constants
        }
      });
    } catch (e) {
      logError(e, port);
    }
  }

  static async uploadCache(port) {
    const limit = 10;
    const last = await db.posts.toCollection().last();
    let start = await db.posts.toCollection().first();
    const count = await db.posts.toCollection().count();
    const items = {
      cachedPostsCount: 0,
      totalPostsCount: count
    };

    async.doWhilst(async next => {
      try {
        const posts = await db.posts.where('id').aboveOrEqual(start.id).limit(limit).toArray();
        start = maxBy(posts, 'id');
        await Firebase.bulkPut('posts', posts);
        items.cachedPostsCount += posts.length;
        log('posts', items, response => {
          port(response);
          next(null, start, last);
        }, false);
      } catch (e) {
        logError(e, next, port);
      }
    }, (start, last) => {
      return start.id !== last.id;
    });
  }

  static async restoreCache(fileSlug, port) { // this only works for files < 100 mb
    try {
      const CacheWorker = require('./cacheWorkerService').default;
      const { offset, fileSize } = fileSlug;
      const progress = calculatePercent(offset, fileSize);
      port({
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
          if (__ENV__ === 'test') {
            return results.data;
          }
          Cache._addPostsToDb(results.data, port);
        },
        error: e => {
          console.error(e);
          logError(e, port);
        },
        skipEmptyLines: true
      });
    } catch (e) {
      console.error(e);
    }
  }

  static _addPostsToDb(posts, port) {
    const items = {
      cachedPostsCount: 0,
      totalPostsCount: posts.length - 1
    };
    async.doWhilst(async next => {
      try {
        await Likes.put(posts[items.cachedPostsCount]);
        items.cachedPostsCount += 1;
        log('posts', items, data => {
          port(data);
          next(null, items.cachedPostsCount);
        }, false);
      } catch (e) {
        logError(e, next, port);
      }
    }, count => {
      return count !== posts.length - 1;
    });
  }

  static async restoreViaFirebase(port) {
    try {
       const posts = await Firebase.get('posts', port);
       Cache._addPostsToDb(posts, port);
     } catch (e) {
       logError(e, port);
     }
  }

  static async deleteFirebaseCache(port) {
    try {
      await Firebase.delete('posts');
    } catch (e) {
      logError(e, port);
    }
  }
}
