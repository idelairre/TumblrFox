import async from 'async';
import { ajax, Deferred } from 'jquery';
import { maxBy, union } from 'lodash';
import constants from '../constants';
import { log, calculatePercent } from '../utils/loggingUtil';
import db from './db';
import Firebase from './firebase';
import 'babel-polyfill';

function getBinarySize(string) {
  return Buffer.byteLength(string, 'utf8');
}

function JsonToCsvConverter(jsonData, ReportTitle, ShowLabel) {
  const deferred = Deferred();
  try {
    console.log('[CONVERTING TO CSV]');
    jsonData = (typeof jsonData !== 'object' ? JSON.parse(jsonData) : jsonData);
    let csv = '';
    let headers = [];
    csv += ReportTitle + '\r\n\n';
    if (ShowLabel) {
      const keys = [];
      for (let i = 0; jsonData.length > i; i += 1) {
        const item = jsonData[i];
        headers = union(keys, Object.keys(item));
      }
      let row = headers.join('Ꮂ').replace(/[\[\]']+/g, '');
      csv += row + '\r\n'; // append Label row with line break
    }
    for (let i = 0; i < jsonData.length; i += 1) { // 1st loop is to extract each row
      let row = Array(headers.length).fill(null);
      for (const index in jsonData[i]) { // 2nd loop will extract each column and convert it in string comma-seprated
        if ({}.hasOwnProperty.call(jsonData[i], index)) {
          row[headers.indexOf(index)] = `${JSON.stringify(jsonData[i][index])}`;
        }
      }
      row = row.join('Ꮂ');
      row.slice(0, row.length);
      csv += `${row}\r\n`; // add a line break after each row
    }
    deferred.resolve(csv);
  } catch (e) {
    deferred.reject(e);
  }
  return deferred.promise();
}

export default class Cache {
  static async assembleCache(port) {
    console.log('[CACHING DATABASE]');
    const posts = await db.posts.toCollection().toArray();
    const payload = await JsonToCsvConverter(posts, 'posts', true);
    if (payload) {
      console.log('[DONE CACHING]');
    }
    port({
      message: 'cache',
      payload
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
      response.constants = constants;
      response.percentComplete = 100,
      await db.open();
      port(response);
      setTimeout(() => {
        port({
          message: 'processDone'
        });
        alert('Cache cleared');
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
        console.log('[CACHING DATABASE] uploaded posts:',
        items.cachedPostsCount, 'total posts:',
        items.totalPostsCount, 'last:', last);
        const posts = await db.posts.where('id').aboveOrEqual(last.id).limit(limit).toArray();
        last = maxBy(posts, 'id');
        await Firebase.bulkPut('posts', posts);
        items.cachedPostsCount += posts.length;
        if (items.cachedPostsCount >= count) {
          console.log('[DONE UPLOADING]');
          port({
            message: 'cache',
            url: `https://tumblrfox.firebaseio.com/${constants.userName}.json`
          });
        }
        log('posts', items, response => {
          port(response);
          next(null);
        }, false);
      } catch (e) {
        console.error(e);
        port({
          error: e
        });
        next(e);

      }
    });
  }

  static parseBlob(file, port) {
    let i = 0;
    const posts = JSON.parse(file);
    async.whilst(() => {
      return posts.length > i;
    }, async next => {
      await db.posts.put(posts[i]);
      console.log('[ADDED]', posts[i].id);
      i += 1;
      items.cachedPostsCount = await db.posts.toCollection().count();
      constants.set('cachedPostsCount', items.cachedPostsCount);
      log('posts', items, data => {
        port(data);
        next(null);
      }, false);
    });
  }

  static async restoreCache(fileSlug, port) {
    const { parsedFile, fileSize } = fileSlug;
    const blobSize = getBinarySize(parsedFile);
    worker.onmessage = e => {
      FileBlob = e.data;
      const blobSize = getBinarySize(FileBlob);
      const response = calculatePercent(blobSize, fileSize);
      console.log(response);
      port(response);
      // if (blobSize >= fileSize) {
      //   this.parseBlob(fileBlob, port)
      // }
    };
    worker.postMessage([FileBlob, parsedFile]);
  }

  static async downloadCache(port) {
    console.log('[CACHING DATABASE]');
    ajax({
      type: 'GET',
      url: `https://tumblrfox.firebaseio.com/${constants.userName}/posts.json`,
      success: data => {
        console.log(data);
        port({
          message: 'cache',
          url: `https://tumblrfox.firebaseio.com/${constants.userName}.json`
        });
      },
      error: error => {
        console.log(error);
      }
    });
  }
}
