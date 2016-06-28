import { forIn, kebabCase } from 'lodash';
import async from 'async';
import db from '../lib/db';
import Source from '../source/followingSource';
import { log, logError } from '../services/loggingService';
import constants from '../constants';
import 'babel-polyfill';

export default class Following {
  static async fetch(query) {
    let response = {};
    if (query && query === 'alphabetically') {
      response = await db.following.orderBy('name').toArray();
    } else if (query && query === 'orderFollowed') {
      response = await db.following.orderBy('order').toArray(); // maybe fetch each user individually and update? delegate to front end?
    } else { // recently updated
      await Following.refresh(); // TODO: add flag to indicate whether to refresh or not
      response = await db.following.orderBy('updated').reverse().toArray();
    }
    return response;
  }

  static async fetchNsfwBlogs() {
    let following = await db.following.filter(follower => {
      if (follower.hasOwnProperty('content_rating')) {
        return follower;
      }
    }).toArray();
    const response = {};
    following.forEach(follower => {
      response[follower.name] = follower.content_rating;
    });
    return response;
  }

  static async update(postData) {
    try {
      const follower = await db.following.get(postData.tumblelog);
      if (follower && !follower.content_rating) {
        follower.content_rating = postData['tumblelog-content-rating'];
        db.following.put(follower);
      }
    } catch (e) {
      console.error(e);
    }
  }

  static async destroy(payload) {
    console.log('[DESTROY]', payload);
  }

  static refresh() {
    const slug = { offset: 0, limit: 20 };
    async.doWhilst(async next => {
      try {
        const following = await Source.start(null, slug);
        if (typeof following === 'undefined') {
          console.error(Source.MAX_RETRIES_MESSAGE);
          next(Source.MAX_RETRIES_MESSAGE);
        } else {
          await Following.bulkPut(following);
          slug.offset += slug.limit;
          next(null, following);
        }
      } catch (e) {
        next(e);
      }
    }, async following => {
      return following.length !== 0;
    });
  }

  static cache(sendResponse) {
    const items = {
      cachedFollowingCount: constants.get('cachedFollowingCount'),
      totalFollowingCount: constants.get('totalFollowingCount')
    };
    async.doWhilst(async next => {
      try {
        const following = await Source.start(); // NOTE: this returns undefined when recursive error handling starts
        if (typeof following === 'undefined') {
          logError(Source.MAX_RETRIES_MESSAGE, next, sendResponse);
        } else if (following.length === 0) {
          sendResponse({
            type: 'done',
            payload: constants,
            message: Source.MAX_ITEMS_MESSAGE
          });
          next(null, following);
        } else {
          await Following.bulkPut(following);
          items.cachedFollowingCount = constants.get('cachedFollowingCount');
          log('following', items, progress => {
            sendResponse(progress);
            next(null, following);
          });
        }
      } catch (e) {
       logError(e, next, sendResponse);
      }
    }, following => {
      return following.length !== 0;
    });
  }

  static async put(follower) { // TODO: this needs to be made into an actual put so it doesn't increment unnecessarily
    try {
      const count = await db.following.toCollection().count();
      follower.order = count + 1;
      await db.following.put(follower);
      constants.set('cachedFollowingCount', count);
    } catch (e) {
      console.error(e);
    }
  }

  static async bulkPut(following) {
    try {
      for (let i = 0; following.length > i; i += 1) {
        await Following.put(following[i]);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
