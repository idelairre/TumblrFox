import async from 'async';
import { escape, maxBy, once, trim } from 'lodash';
import CacheWorker from '../services/cacheWorker';
import constants from '../constants';
import { log, calculatePercent } from '../services/logging';
import db from '../lib/db';
import Firebase from '../services/firebase';
import Likes from './likeStore';
import 'babel-polyfill';

export default class Cache {
  static send(data) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
        
      });
    });
  }

  static async assembleCacheAsCsv(port) {
    console.log('[CACHING DATABASE]');
    const posts = await db.posts.toCollection().toArray();
    async.waterfall([
      async.apply(CacheWorker.convertJsonToCsv, posts),
      CacheWorker.assembleFileBlob
    ], (error, result) => {
      if (error) {
        console.error(error);
        return port({
          type: 'error',
          payload: `${error}`
        });
      }
      port({
        type: 'cacheConverted',
        payload: {
          type: 'csv',
          file: result
        }
      });
    });
  }

  static async assembleCacheAsJson(port) {
    const posts = await db.posts.toCollection().toArray();
    CacheWorker.assembleFileBlob({ file: posts, type: 'json' }, (error, payload) => {
      if (error) {
        console.error(error);
        return port({
          type: 'error',
          payload: error
        });
      }
      port({
        type: 'cacheConverted',
        payload: {
          type: 'json',
          file: payload
        }
      });
    });
  }

  static async resetCache(port) {
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
    } catch (e) {
      port(e);
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
        console.log('[CACHING DATABASE] uploaded posts:', items.cachedPostsCount, 'total posts:', items.totalPostsCount, 'last:', last);
        const posts = await db.posts.where('id').aboveOrEqual(last.id).limit(limit).toArray();
        last = maxBy(posts, 'id');
        await Firebase.bulkPut('posts', posts);
        items.cachedPostsCount += posts.length;
        if (items.cachedPostsCount >= count) {
          console.log('[DONE UPLOADING]');
          port({
            type: 'cacheUploaded',
            payload: {
              url: `https://tumblrfox.firebaseio.com/${constants.userName}.json`
            }
          });
          return;
        }
        log('posts', items, response => {
          port(response);
          next(null);
        }, false);
      } catch (e) {
        console.error(e);
        port({
          type: 'error',
          payload: e
        });
        next(e);
      }
    });
  }

  static restoreCache(fileSlug, port) { // this only works for files < 100 mb
    async.waterfall([
      async.apply(CacheWorker.assembleFile, fileSlug),
      CacheWorker.convertCsvToJson,
    ], (error, result) => {
      if (error) {
        return port({
          type: 'error',
          payload: error
        });
      }
      Cache._addPostsToDb(result, port); // see if we can't move this into the waterfall
    });
  }

  static _addPostsToDb(posts, port) {
    let i = 0;
    const items = {
      cachedPostsCount: 0,
      totalPostsCount: posts.length
    };
    async.whilst(() => {
      return posts.length > i;
    }, async next => {
      try {
        await Likes.put(posts[i]);
        i += 1;
        items.cachedPostsCount = i;
        log('posts', items, data => {
          port(data);
          next(null);
          console.log(data);
        }, false);
      } catch (e) {
        console.error(e);
        next(e);
        port({
          type: 'error',
          payload: `${e}`
        });
      }
    });
  }

  static async restoreViaFirebase(port) {
    try {
       const posts = await Firebase.get('posts');
       console.log(posts);
       Cache._addPostsToDb(posts, port);
     } catch (e) {
       console.error(e);
       port({
         type: 'error',
         payload: `${e}`
       });
     }
  }
}
