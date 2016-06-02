import { Deferred } from 'jquery';
import async from 'async';
import db from '../lib/db';
import Source from '../source/followingSource';
import { log, logError } from '../services/logging';
import constants from '../constants';
import 'babel-polyfill';

export default class Following {
  static async send(request, sender, sendResponse) {
    const response = await Following.fetch(request.payload);
    sendResponse(response);
  }

  static async fetch(query) {
    console.log(query);
    let response = {};
    if (query && query === 'alphabetically') {
      response = await db.following.orderBy('name').toArray();
    } else if (query && query === 'orderFollowed') {
      response = await db.following.orderBy('id').toArray(); // maybe fetch each user individually and update?
    } else { // recently updated
      Following.refresh();
      response = await db.following.orderBy('updated').reverse().toArray();
    }
    return response;
  }

  static async sync() {
    // as my Java prof. would say: implementation goes here
  }

  static refresh() {
    const slug = { offset: 0, limit: 20 };
    async.doWhilst(async next => {
      try {
        const following = await Source.start(null, slug);
        await Following.bulkPut(following);
        slug.offset += slug.limit;
        next(null, following);
      } catch (e) {
        next(e);
      }
    }, async following => {
      return following.length !== 0;
    });
  }

  static cache(port) {
    const items = {
      cachedFollowingCount: constants.get('cachedFollowingCount'),
      totalFollowingCount: constants.get('totalFollowingCount')
    };
    async.doWhilst(async next => {
      try {
        const following = await Source.start();
        await Following.bulkPut(following);
        items.cachedFollowingCount = constants.get('cachedFollowingCount');
        log('following', items, progress => {
          port(progress);
          next(null, items);
        });
      } catch (e) {
       logError(e, next, port)
      }
    }, async items => {
      return items.cachedFollowingCount < items.totalFollowingCount;
    });
  }

  static async put(follower) {
    try {
      const count = await db.following.toCollection().count();
      follower.order = count + 1;
      await db.following.put(follower);
      constants.set('cachedFollowingCount', count);
    } catch (e) {
      console.error(e);
    }
  }

  static bulkPut(following) {
    try {
      const promises = following.map(Following.put);
      return Promise.all(promises);
    } catch (e) {
      console.error(e);
    }
  }
}
