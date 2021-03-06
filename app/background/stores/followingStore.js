import { has, isFunction, noop } from 'lodash';
import db from '../lib/db';
import noopCallback from '../utils/noopCallback';
import Source from '../source/followingSource';
import { logValues, logError } from '../services/loggingService';
import constants from '../constants';

export default class Following {
  static caching = false;

  static async fetch(query) {
    if (typeof query === 'undefined') {
      return db.following.toCollection().toArray();
    }
    if (!query.order && (has(query, 'offset') && has(query, 'limit'))) { // this looks like overkill but its needed since evaluating query.offset && query.limit returns a number
      return db.following.toCollection().offset(query.offset).limit(query.limit).toArray();
    } else if (query.order === 'alphabetically') { // NOTE: these cases are for when the user is fetching from the following view
      return db.following.orderBy('name').offset(query.offset).limit(query.limit).toArray();
    } else if (query.order === 'orderFollowed') {
      return db.following.orderBy('order').offset(query.offset).limit(query.limit).toArray();
    } else if (query.order === 'recentlyUpdated') {
      return db.following.orderBy('updated').offset(query.offset).limit(query.limit).reverse().toArray();
    }
  }

  static async fetchNsfwBlogs() {
    const following = await db.following.filter(follower => {
      if (has(follower, 'content_rating') && (follower.content_rating === 'adult' || follower.content_rating === 'nsfw')) {
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
    } catch (err) {
      console.error(err);
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
    if (Following.cache) {
      return;
    }
    Following.cache = true;
    const sendProgress = isFunction(sendResponse) ? logValues.bind(this, 'following', sendResponse) : noopCallback;
    const sendError = isFunction(sendResponse) ? logError : noop;

    Source.addListener('items', async following => {
      await Following.bulkPut(following);
      sendProgress();
      Source.next();
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
    } catch (err) {
      console.error(err, following);
    }
  }

  static async bulkPut(followings) {
    try {
      const promises = followings.map(Following.put);
      return Promise.all(promises);
    } catch (err) {
      console.error(err);
    }
  }

  static async _setContentRating(following) {
    try {
      if (!has(following, 'is_nsfw')) {
        const tumblelogInfo = await Source.getInfo(following.name);
        if (tumblelogInfo.is_nsfw) {
          following.content_rating = 'nsfw';
        }
      }
    } catch (err) {
      console.error(err);
    }
    return following;
  }
}
