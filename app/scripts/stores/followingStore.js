import { Deferred } from 'jquery';
import async from 'async';
import Dexie, { spawn } from 'dexie';
import db from '../lib/db';
import { oauthRequest, resetOauthSlug } from '../lib/oauthRequest';
import { log } from '../utils/loggingUtil';
import constants from '../constants';
import 'babel-polyfill';

export default class Following {
  static async preloadFollowing(port) {
    const slug = {
      url: `https://api.tumblr.com/v2/user/following`,
      limit: 20,
      offset: constants.cachedFollowingCount
    };
    const items = {
      totalFollowingCount: constants.totalFollowingCount,
      cachedFollowingCount: constants.cachedFollowingCount
    };
    console.log('[CACHED FOLLOWING]', items.cachedFollowingCount, constants.totalFollowingCount);
    this.populateFollowing(slug, items, port);
  }

  static populateFollowing(slug, items, port) {
    console.log(items.totalFollowingCount > items.cachedFollowingCount);
    async.whilst(() => {
      return items.totalFollowingCount > items.cachedFollowingCount;
    }, async next => {
      try {
        let response = await oauthRequest(slug);
        const nextSlug = { slug, response, items };
        await this.processFollowing(nextSlug);
        log('following', items, data => {
          next(null);
          port(data);
        });
      } catch (e) {
        console.error(e);
        port({ error: `${e}` });
        next(e);
      }
    });
  }

  static processFollowing({ slug, response, items }) {
    const deferred = Deferred();
    if (response.blogs && response.blogs.length) {
      resetOauthSlug(slug);
      slug.offset += response.blogs.length;
      items.cachedFollowingCount += response.blogs.length;
      const transaction = db.following.bulkPut(response.blogs);
      transaction.then(() => {
        deferred.resolve();
      });
    } else {
      resetOauthSlug(slug);
      deferred.reject('Response was empty');
    }
    return deferred.promise();
  }

  static async syncFollowing() {
    const slug = {
      url: `https://api.tumblr.com/v2/user/following`,
      limit: 1,
      offset: 0
    };
    const response = await oauthRequest(slug);
    db.following.put(response.blogs[0]);
  }

  static async fetchFollowing(query, callback) {
    if (query === 'alphabetically') {
      const followers = await db.following.orderBy('name').toArray();
      console.log('[FOLLOWERS]', followers);
      return callback(followers);
    } else {
      const followers = await db.following.orderBy('updated').reverse().toArray();
      console.log('[FOLLOWERS]', followers);
      return callback(followers);
    }
  }
}
