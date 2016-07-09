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

  static async reset(sendResponse) {
    try {
      await db.delete();
      constants.reset();
      await db.open();
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
        log('posts', data => {
          sendResponse(data);
          next(null, items.cachedPostsCount);
        }, false);
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
