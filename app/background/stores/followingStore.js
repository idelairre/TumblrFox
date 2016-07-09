import { forIn, kebabCase } from 'lodash';
import async from 'async';
import db from '../lib/db';
import Source from '../source/followingSource';
import { logValues, logError } from '../services/loggingService';
import constants from '../constants';
import 'babel-polyfill';

export default class Following {
  static async fetch(query) {
    // NOTE: these cases are for when the user is fetching from the following view
    if (query && query.order === 'alphabetically') {
      return db.following.orderBy('name').offset(query.offset).limit(query.limit).toArray();
    } else if (query && query.order === 'orderFollowed') {
      return db.following.orderBy('order').offset(query.offset).limit(query.limit).toArray();
    } else if (query && query.order === 'recentlyUpdated') {
      return db.following.orderBy('updated').offset(query.offset).limit(query.limit).reverse().toArray();
    }
    return db.following.toCollection().toArray();
  }

  static async fetchNsfwBlogs() {
    const following = await db.following.filter(follower => {
      if (follower.hasOwnProperty('content_rating') && follower.content_rating === 'adult' || follower.content_rating === 'nsfw') {
        return follower;
      }
    }).toArray();
    const response = {};
    following.forEach(follower => {
      response[follower.name] = follower.content_rating;
    });
    return response;
  }

  static async get(tumblelog) {
    try {
      await db.following.get(tumblelog);
    } catch (e) {
      console.error(e);
    }
  }

  static async destroy(payload) {
    console.log('[DESTROY]', payload);
  }

  static refresh() {
    const slug = {
      offset: 0,
      limit: 20
    };
    async.doWhilst(async next => {
      try {
        const following = await Source.start(slug);
        slug.offset += slug.limit;
        if (typeof following === 'undefined') {
          console.error(Source.MAX_RETRIES_MESSAGE);
          next(Source.MAX_RETRIES_MESSAGE);
        } else {
          await Following.bulkPut(following);
          next(null, following);
        }
      } catch (e) {
        next(e);
      }
    }, following => {
      return following.length !== 0;
    });
  }

  static cache(sendResponse) {
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
          logValues('following', sendResponse);
          next(null, following);
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
      const tumblelogInfo = await Source.getInfo(follower.name);
      if (tumblelogInfo.is_nsfw) {
        follower.content_rating = 'nsfw';
      }
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
