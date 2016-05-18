import { Deferred } from 'jquery';
import db from '../lib/db';
import { log } from '../utils/loggingUtil';
import 'babel-polyfill';

export default class Tags {
  static parseTagsArray(tagArrays) {
    console.log('[CACHING TAGS...]', tagArrays.length);
    const deferred = Deferred();
    const tags = {};
    let total = 0;
    for (let i = 0; tagArrays.length > i; i += 1) {
      if (tagArrays[i].length > 0) {
        // for (let j = 0; tagArrays[i].length > j; j += 1) {
          if (typeof tags[tagArrays[i]] !== 'undefined') {
            tags[tagArrays[i]].count += 1;
          } else {
            const tag = {
              tag: tagArrays[i],
              count: 1
            };
            total += 1;
            tags[tagArrays[i]] = tag;
          }
        // }
      }
    }
    console.log('[DONE]');
    return deferred.resolve({ tags, total });
  }

  static async processTags(tags, items, callback) {
    for (const key in tags) {
      if ({}.hasOwnProperty.call(tags, key)) {
        await db.tags.put(tags[key]);
        items.cachedTagsCount += 1;
        console.log(items);
        callback({ items });
      }
    }
  }

  static async cacheLikeTags(port) {
    const tagArrays = await db.posts.orderBy('tags').keys();
    const { tags, total } = await this.parseTagsArray(tagArrays);
    let items = {
      totalTagsCount: total,
      cachedTagsCount: 0
    };
    this.processTags(tags, items, response => {
      items = response.items;
      log('tags', items, data => {
        port(data);
      });
    });
  }

  static async fetchLikeTags(port) {
    const tags = await db.tags.orderBy('count').reverse().toArray();
    port(tags);
  }
}
