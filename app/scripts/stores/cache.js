import async from 'async';
import { maxBy } from 'lodash';
import constants from '../constants';
import { log, calculatePercent } from '../utils/loggingUtil';
import db from '../lib/db';
import Firebase from '../lib/firebase';
import Likes from './likeStore';
import 'babel-polyfill';
import 'operative';

const getBinarySize = string => {
  return Buffer.byteLength(string, 'utf8');
};

const cacheWorker = operative({
  convertJsonToCsv(jsonData, showLabel, callback) {
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
  },
  convertCsvToJson(csvData) {
    const lines = csvData.split('\n');
    const colNames = lines[0].split('Ꮂ');
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const record = {};
      const bits = lines[i].split('Ꮂ');
      for (let j = 0; j < bits.length; j++) {
        record[colNames[j]] = bits[j];
      }
      records.push(record);
    }
    return records;
  },
  assembleFileBlob(file, callback) {
    try {
      const url = URL.createObjectURL(new Blob([file], {
        type: 'application/csv,charset=utf-8'
      }));
      callback(null, url);
    } catch (e) {
      callback(e);
    }
  },
  parseFile(file, callback) {
    const parsedFile = JSON.parse(file);
    callback(parsedFile);
  },
  stringifyPosts(posts, callback) {
    const stringifiedPosts = JSON.stringify(posts);
    callback(stringifiedPosts);
  },
  readFile(file, callback) {
    const r = new FileReader();
    r.onload = e => {
      const rawFile = e.target.result;
      callback(rawFile);
    };
    r.readAsText(file);
  }
});

export default class Cache {
  static async assembleCacheAsCsv(port) {
    console.log('[CACHING DATABASE]');
    const posts = await db.posts.toCollection().toArray();
    console.time('[CONVERT TO CSV]');
    cacheWorker.convertJsonToCsv(posts, true, (error, fileString) => {
      console.timeEnd('[CONVERT TO CSV]');
      cacheWorker.assembleFileBlob(fileString, (error, payload) => {
        port({
          action: 'cacheConverted',
          payload: {
            type: 'csv',
            file: payload
          }
        });
      });
    });
  }

  static async assembleCacheAsJson(port) {
    const posts = await db.posts.toCollection().toArray();
    cacheWorker.stringifyPosts(posts, stringifiedPosts => {
      cacheWorker.assembleFileBlob(stringifiedPosts, (error, payload) => {
        port({
          action: 'cacheConverted',
          payload: {
            type: 'json',
            file: payload
          }
        });
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

  static restoreCache(fileSlug, port) {
    console.log('[ARGUMENTS]', fileSlug);
    cacheWorker.parseJson(fileSlug.file, parsedFile => {
      const keys = Object.keys(parsedFile.posts);
      const posts = keys.map(key => {
        return parsedFile[key];
      });
      let i = 0;
      const items = {
        cachedPostsCount: 0
      };
      async.whilst(() => {
        return posts.length > i;
      }, async next => {
        try {
          await Likes.put(posts[i]);
          console.log('[ADDED]', posts[i].id);
          i += 1;
          items.cachedPostsCount = await db.posts.toCollection().count();
          constants.set('cachedPostsCount', items.cachedPostsCount);
          log('posts', items, data => {
            port(data);
            next(null);
          }, false);
        } catch (e) {
          console.error(e);
        }
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
