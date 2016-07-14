import { forIn, kebabCase } from 'lodash';
import async from 'async';
import db from '../lib/db';
import Source from '../source/followingSource';
import { logValues, logError } from '../services/loggingService';
import constants from '../constants';
import 'babel-polyfill';

export default class Following {
  static async fetch(query) {
    if (query && query.order === 'alphabetically') { // NOTE: these cases are for when the user is fetching from the following view
      return db.following.toCollection().offset(query.offset).limit(query.limit).toArray();
    } else if (query && query.order === 'orderFollowed') {
      return db.following.orderBy('order').offset(query.offset).limit(query.limit).toArray();
    } else if (query && query.order === 'recentlyUpdated') {
      return db.following.orderBy('updated').offset(query.offset).limit(query.limit).reverse().toArray();
    }
    if (query && query.offset && query.limit) {
      const response = await db.following.toCollection().offset(query.offset).limit(query.limit).reverse().toArray();
      return response;
    }
    return await db.following.toCollection().toArray();
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

  static async update(tumblelog) {
    await Following.put(tumblelog, true);
  }

  static refresh() {
    const options = {
      offset: 0,
      limit: 20,
      retryTimes: 0
    };
    async.doWhilst(async next => {
      try {
        const following = await Source.start(options);
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
      const port = logValues.bind(this, 'following', sendResponse);
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
          port(() => {
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

  static async put(following, isTumblelog) {
    try {
      const count = await db.following.toCollection().count();
      if (!isTumblelog) {
        following = await Following._setContentRating(following);
        following.order = count + 1;
      }
      await db.following.put(following);
      constants.set('cachedFollowingCount', count);
    } catch (e) {
      console.error(e, following);
    }
  }

  static async bulkPut(followings) {
    try {
      const promises = followings.map(async following => {
        return await Following.put(following);
      });
      Promise.all(promises);
    } catch (e) {
      console.error(e);
    }
  }

  static async _setContentRating(following) {
    try {
      if (!following.hasOwnProperty('is_nsfw')) {
        const tumblelogInfo = await Source.getInfo(following.name);
        if (tumblelogInfo.is_nsfw) {
          following.content_rating = 'nsfw';
        }
      }
      return following;
    } catch (e) {
      console.error(e);
    } finally {
      return following;
    }
  }
}
