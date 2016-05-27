import async from 'async';
import { escape, maxBy, once, trim } from 'lodash';
import constants from '../constants';
import { log, calculatePercent } from '../services/logging';
import db from '../lib/db';
import Firebase from '../services/firebase';
import Likes from './likeStore';
import Parser from '../services/parser';
import 'babel-polyfill';
import 'operative';

class CacheWorker extends operative {
  static fileBlob = '';

  static assembleFile({ fileFragment, offset, fileSize }, callback) {
    if (fileFragment.length === 0) {
      console.log('[DONE ASSEMBLING FILE]');
      callback(this.fileBlob);
      return;
    }
    if (!this.fileBlob.includes(fileFragment)) {
      this.fileBlob += fileFragment;
      console.log(`[ASSEMBLING FILE]: ${offset} out of ${fileSize}`);
    }
  }

  static convertJsonToCsv(jsonData, showLabel, callback) {
    try {
      let csv = '';
      const headers = [];
      if (showLabel) {
        const keys = [];
        for (let i = 0; jsonData.length > i; i += 1) {
          const item = jsonData[i];
          Object.keys(item).map(key => {
            if (!keys.includes(key)) {
              headers.push(key);
            }
          });
        }
        const row = headers.join('Ꮂ').replace(/[\[\]']+/g, '');
        csv += `${row}\r\n`; // append Label row with line break
      }
      for (let i = 0; i < jsonData.length; i += 1) { // 1st loop is to extract each row
        let row = [];
        for (const index in jsonData[i]) { // 2nd loop will extract each column and convert it in string comma-seprated
          if ({}.hasOwnProperty.call(jsonData[i], index)) {
            row[headers.indexOf(index)] = `${JSON.stringify(jsonData[i][index])}`;
          }
        }
        row = row.join('Ꮂ');
        csv += `${row}\r\n`; // add a line break after each row
      }
      callback(null, csv);
    } catch (e) {
      callback(e);
    }
  }

  static convertCsvToJson(csvData) {
    const lines = csvData.split('\n');
    const colNames = lines[0].split('Ꮂ');
    const records = [];
    for (let i = 1; i < lines.length; i += 1) {
      const record = {};
      const bits = lines[i].split('Ꮂ');
      for (let j = 0; j < bits.length; j += 1) {
        record[colNames[j]] = bits[j];
      }
      records.push(record);
    }
    return records;
  }

  static assembleFileBlob(posts, type, callback) {
    try {
      post.map(post => {
        post.html = post.html.replace(/"/g, '\\"');
      });
      if (type === 'json') {
        file = JSON.stringify(file, null, '\t');
      }
      const url = URL.createObjectURL(new Blob([posts], {
        type: `application/${type},charset=utf-8`
      }));
      callback(null, url);
    } catch (e) {
      callback(e);
    }
  }

  static parsePosts(posts, callback) {
    try {
      const parsedPosts = JSON.parse(posts);
      callback(null, parsedPosts);
    } catch (e) {
      callback(e);
    }
  }
}

export default class Cache {
  static async assembleCacheAsCsv(port) {
    console.log('[CACHING DATABASE]');
    const posts = await db.posts.toCollection().toArray();
    cacheWorker.convertJsonToCsv(posts, true, (error, fileString => {
      console.timeEnd('[CONVERT TO CSV]');
      cacheWorker.assembleFileBlob(fileString, 'csv', (error, payload) => {
        port({
          action: 'cacheConverted',
          payload: {
            type: 'csv',
            file: payload
          }
        });
      });
    }));
  }

  /**
  *  Escapes html, stringifies posts and converts result to fileBlob 
  */

  static async assembleCacheAsJson(port) {
    const posts = await db.posts.toCollection().toArray();
    CacheWorker.assembleFileBlob(posts, 'json', (error, payload) => {
      port({
        action: 'cacheConverted',
        payload: {
          type: 'json',
          file: payload
        }
      });
    });
  }

  static async resetCache(port) {
    try {
      const response = {
        percentComplete: 0,
        itemsLeft: 0,
        total: 0,
        database: 'all'
      };
      port(response);
      await db.delete();
      constants.reset();
      console.log('[DB] deleted');
      response.percentComplete = 100;
      await db.open();
      port(response);
      setTimeout(() => {
        port({
          action: 'done'
        });
        port({
          action: 'replyConstants',
          payload: constants
        });
      }, 100);
    } catch (e) {
      console.error('[DB]', e);
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
            action: 'cacheUploaded',
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
          action: 'error',
          payload: e
        });
        next(e);
      }
    });
  }

  static parseCache(fileSlug, port) {
    if (fileSlug.fileFragment.length === 0) {
      console.log('[DONE ASSEMBLING FILE]');
      port({ action: 'done' });
      return;
    }
    parser.write(fileSlug.fileFragment).close();
  }

  static restoreCache(fileSlug, port) { // this only works for files < 100 mb
    cacheWorker.assembleFile(fileSlug, fileString => {
      console.log('[PARSING FILE...]');
      const file = JSON.parse(fileString)
      const posts = file.posts || file;
      cacheWorker.parsePosts(fileString, (error, file) => {
        const posts = file.posts || file
        if (error) {
          return port({
            action: 'error',
            payload: error
          });
        }
        console.log('[FILE PARSED]', file);
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
            console.log('[ADDED]', posts[i].id);
            i += 1;
            items.cachedPostsCount = i;
            // constants.set('cachedPostsCount', items.cachedPostsCount);
            log('posts', items, data => {
              port(data);
              next(null);
            }, false);
          } catch (e) {
            console.error(e);
            next(e);
          }
        });
      });
    });
  }

  static async validateCache(port) {
    const firebasePosts = await Firebase.get('posts');
    const dbPostsCount = await db.posts.toCollection().count();
    if (firebasePosts.length === dbPostsCount) { // TODO: iterate through posts to make sure they all have keys and tag attributes
      if (port) {
        port({
          action: 'validateCache',
          payload: true
        });
        return false;
      }
    } else {
      if (port) {
        port({
          action: 'validateCache',
          payload: false
        });
      }
      return false;
    }
  }

  static async downloadCache(port) {
    try {
       const posts = await Firebase.get('posts');
       port({
         action: 'downloadCache',
         payload: posts
       });
     } catch (e) {
       console.error(e);
       port({
         action: 'error',
         payload: e
       });
     }
  }
}
