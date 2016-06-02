import { Deferred } from 'jquery';
import constants from '../constants';
import db from '../lib/db';
import { log } from '../services/logging';
import 'babel-polyfill';

export default class Tags {
  static async send(request, sender, sendResponse) {
    const response = await Tags.fetch(request.payload);
    sendResponse(response);
  }

  static async fetch(port) {
    const tags = await db.tags.orderBy('count').reverse().toArray();
    return tags;
  }

  static async add(tags) {
    const promises = tags.map(Tags._putAndIncrementTags);
    return Promise.all(promises);
  }

  static async _putAndIncrementTags(tagName) {
    try { // fetching the tag first to see if it exists doesn't reliably work for some reason, hence this try/catch closure
      const tagSlug = {
        tag: tagName,
        count: 1
      };
      await db.tags.add(tagSlug);
    } catch (e) {
      const tag = await db.tags.get(tagName);
      tag.count += 1;
      await db.tags.put(tag);
    } finally {
      const count = await db.tags.toCollection().count();
      if (constants.get('cachedTagsCount') !== count) {
        constants.set('cachedTagsCount', count);
      }
    }
  }
}
