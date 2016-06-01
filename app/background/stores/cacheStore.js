import async from 'async';
import { escape, maxBy, once, trim } from 'lodash';
import Papa from '../lib/papaParse';
import CacheWorker from '../services/cacheWorker';
import constants from '../constants';
import { log, logError, calculatePercent } from '../services/logging';
import db from '../lib/db';
import Firebase from '../services/firebase';
import Likes from './likeStore';
import 'babel-polyfill';

console.log(Papa);

export default class Cache {
  static async assembleCacheAsCsv(port) {
    try {
      const posts = await db.posts.toCollection().toArray();
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
      console.log('[DB] deleted');
      await db.open();
      port({
        type: 'done',
        payload: {
          message: 'Cache reset',
          constants
        }
      });
    } catch(e) {
      logError(e, port);
    }
  }

  static async uploadCache(port) {
    const limit = 1000;
    const count = await db.posts.toCollection().count();
    let last = await db.posts.toCollection().first();
    const items = {
      cachedPostsCount: 0,
      totalPostsCount: count
    };
    async.whilst(() => {
      return items.cachedPostsCount <= items.totalPostsCount;
    }, async next => {
      try {
        const posts = await db.posts.where('id').aboveOrEqual(last.id).limit(limit).toArray();
        last = maxBy(posts, 'id');
        await Firebase.bulkPut('posts', posts);
        items.cachedPostsCount += posts.length;
        log('posts', items, response => {
          port(response);
          next(null);
        }, false);
      } catch (e) {
        logError(e, next, port);
      }
    });
  }

  static async restoreCache(fileSlug, port) { // this only works for files < 100 mb
    try {
      const { offset, fileSize } = fileSlug;
      const response = calculatePercent(offset, fileSize);
      port({
        type: 'progress',
        payload: response
      });
      const file = await CacheWorker.assembleFile(fileSlug);
      Papa.parse(file, {
      	delimiter: 'Ꮂ',	// auto-detect
      	newline: '',	// auto-detect
      	header: true,
      	dynamicTyping: true,
      	worker: false,
      	comments: false,
      	complete: (results, parse) => {
          Cache._addPostsToDb(results.data, port)
        },
      	error: e => {
          console.error(e);
          logError(e, port);
        },
      	download: false,
      	skipEmptyLines: true,
      	fastMode: undefined
      });
    } catch (e) {
      console.error(e);
    }
      // const postsJson = await CacheWorker.convertCsvToJson(file);
    }

  static _addPostsToDb(posts, port) {
    console.log(posts);
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
        console.error(e);
        logError(e, next, port);
      }
    }, count => {
      return count !== posts.length - 1;
    });
  }

  static async restoreViaFirebase(port) {
    try {
       const posts = await Firebase.get('posts');
       Cache._addPostsToDb(posts, port);
     } catch (e) {
       logError(e, port);
     }
  }
}
