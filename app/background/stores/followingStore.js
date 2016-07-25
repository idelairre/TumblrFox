import { forIn, isFunction, kebabCase } from 'lodash';
import async from 'async';
import db from '../lib/db';
import { noopCallback } from '../utils/helpers';
import Source from '../source/followingSource';
import { logValues, logError } from '../services/loggingService';
import constants from '../constants';
import 'babel-polyfill';

let caching = false;

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
      return await db.following.toCollection().offset(query.offset).limit(query.limit).reverse().toArray();
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
      retryTimes: 0,
      sync: true
    };
    Source.addListener('items', async following => {
      await Following.bulkPut(following);
      const count = await db.following.toCollection().count();
      constants.set('cachedFollowingCount', count);
    });
    Source.addListener('error', err => {
      console.error(err);
    });
    Source.addListener('done', () => {
      Source.removeListeners();
    });
    Source.start(options);
  }

  static cache(sendResponse) {
    if (caching) {
      return;
    }
    caching = true;
    const sendProgress = isFunction(sendResponse) ? logValues.bind(this, 'following', sendResponse) : noopCallback;
    const sendError = isFunction(sendResponse) ? logError : noop;
    Source.addListener('items', async following => {
      await Following.bulkPut(following);
      Source.next();
      sendProgress();
    });
    Source.addListener('error', err => {
      sendError(err, sendResponse);
    });
    Source.addListener('done', msg => {
      if (isFunction(sendResponse)) {
        sendResponse({
          type: 'done',
          payload: constants,
          message: msg
        });
      }
      Source.removeListeners();
    });
    Source.start();
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
