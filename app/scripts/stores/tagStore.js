import { Deferred } from 'jquery';
import constants from '../constants';
import db from '../lib/db';
import { log } from '../utils/loggingUtil';
import 'babel-polyfill';

export default class Tags {
  static async process(tags, items, callback) {
    const keys = Object.keys(tags);
    const promises = keys.map(async key => {
      await db.tags.put(tags[key]);
      items.cachedTagsCount = await db.tags.toCollection().count();
      constants.set('cachedTagsCount', items.cachedTagsCount);
      callback({
        constants,
        items
      });
    });
    const resolve = Promise.all(promises);
    await resolve;
  }

  static async cache(port) {
    const tagArrays = await db.posts.orderBy('tags').keys();
    const { tags, total } = await Tags._parse(tagArrays);
    const items = {
      totalTagsCount: total,
      cachedTagsCount: await db.tags.toCollection().count()
    };
    Tags.process(tags, items, response => {
      const { constants, items } = response;
      log('tags', items, data => {
        data.constants = constants;
        port(data);
      });
    });
  }

  static async fetch(port) {
    const tags = await db.tags.orderBy('count').reverse().toArray();
    port(tags);
  }

  static async add(tags) {
    const promises = tags.map(Tags._putAndIncrementTags);
    return Promise.all(promises);
  }

  static _parse(tagArrays) {
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
    constants.set('totalTagsCount', total);
    return deferred.resolve({ tags, total });
  }

  static async _putAndIncrementTags(tagName) {
    const tagSlug = {
      tag: tagName,
      count: 1
    };
    try { // getting the tag first to see if it exists doesn't reliably work for some reason, hence this try/catch closure
      await db.tags.add(tagSlug);
    } catch (e) {
      tagSlug.count += 1;
      await db.tags.put(tagSlug);
    } finally {
      const count = await db.tags.toCollection().count();
      if (constants.get('cachedTagsCount') !== count) {
        constants.set('cachedTagsCount', count);
      }
    }
  }
}
