import { Deferred } from 'jquery';
import async from 'async';
import Dexie, { spawn } from 'dexie';
import db from '../lib/db';
import { oauthRequest, resetOauthSlug } from '../lib/oauthRequest';
import { log } from '../utils/loggingUtil';
import { constants } from '../constants';
import 'babel-polyfill';

export default class Following {
  static preloadFollowing(port) {
    spawn(function *() {
      const count = yield db.following.toCollection().count();
      const slug = {
        url: `https://api.tumblr.com/v2/user/following`,
        limit: 20,
        offset: constants.cachedFollowingCount - 1
      };
      console.log('[CACHED FOLLOWING]', count);
      this.populateFollowing(slug, constants, count, port);
    });
  }

  static processFollowing({ slug, followingCount, response, items }) {
    const deferred = Deferred();
    slug.offset += response.blogs.length;
    items.total = response.total_blogs;
    constants.cachedfollowingCount = followingCount;
    constants.totalfollowingCount = items.totalFollowingCount;
    if (response.blogs && response.blogs.length) {
      resetOauthSlug(slug);
      const transaction = db.following.bulkPut(response.blogs);
      transaction.then(() => {
        deferred.resolve();
      });
      transaction.catch(Dexie.BulkError, error => {
        console.log('[DB ERROR]', error.message);
        deferred.reject(error);
      });
    } else {
      resetOauthSlug(slug);
      deferred.reject('Response was empty');
    }
    return deferred.promise();
  }

  static populateFollowing(slug, items, followingCount, port) {
    async.whilst(() => {
      return items.totalFollowingCount === 0 || items.totalFollowingCount > followingCount;
    }, next => {
      oauthRequest(slug).then(response => {
        const nextSlug = {
          slug,
          followingCount,
          response,
          items
        };
        console.log('[RESPONSE]', response);
        this.processFollowing(nextSlug).then(() => {
          log('following', followingCount, items, data => {
            next(null);
            port(data);
          });
        }).fail(error => {
          log('following', followingCount, items, data => {
            next(error);
            port(data);
          });
        });
      });
    }, error => {
      console.error(error);
    });
  }

  static syncFollowing() {
    const slug = {
      url: `https://api.tumblr.com/v2/user/following`,
      limit: 1,
      offset: 0
    };
    oauthRequest(slug).then(response => {
      db.following.put(response.blogs[0]);
    });
  }

  static fetchFollowing(query, callback) {
    if (query === 'alphabetically') {
      db.following.orderBy('name').toArray(followers => {
        console.log('[FOLLOWERS]', followers);
        return callback(followers);
      });
    } else {
      db.following.orderBy('updated').reverse().toArray(followers => {
        console.log('[FOLLOWERS]', followers);
        return callback(followers);
      });
    }
  }
}
