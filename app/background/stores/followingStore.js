import { Deferred } from 'jquery';
import async from 'async';
import db from '../lib/db';
import { oauthRequest, resetOauthSlug } from '../lib/oauthRequest';
import { log, logError } from '../services/logging';
import constants from '../constants';
import 'babel-polyfill';

export default class Following {
  static async send(request, sender, sendResponse) {
    const response = await Following.fetch(request.payload);
    sendResponse(response);
  }

  static async fetch(query) {
    let response = {};
    if (query && query === 'alphabetically') {
      response = await db.following.orderBy('name').toArray();
      console.log('[FOLLOWERS]', response);
    } else {
      response = await db.following.orderBy('updated').reverse().toArray();
      console.log('[FOLLOWERS]', response);
    }
    return response;
  }

  static async sync() {
    const slug = {
      limit: 1,
      offset: 0
    };
    const response = await this._getFollowing(slug);
    db.following.put(response.blogs[0]);
  }

  static preload(port) {
    const slug = {
      limit: 20,
      offset: constants.get('cachedFollowingCount') || 0
    };
    Following._populateFollowing(slug, port);
  }

  static _populateFollowing(slug, port) {
    const items = {
      totalFollowingCount: constants.get('totalFollowingCount') || 0,
      cachedFollowingCount: constants.get('cachedFollowingCount') || 0
    };
    async.doWhilst(async () => {
      try {
        const response = await Following._getFollowing(slug);
        const nextSlug = { slug, response, items };
        await Following._processFollowing(nextSlug);
        log('following', items, data => {
          port(data);
          next(null, response);
        });
      } catch (e) {
       logError(e, next, port)
      }
    }, async response => {
      return response;
    });
  }

  static _getFollowing(slug) {
    slug.url = `https://api.tumblr.com/v2/user/following`;
    return oauthRequest(slug);
  }

  static _processFollowing({ slug, response, items }) {
    const deferred = Deferred();
    if (response.blogs && response.blogs.length) {
      resetOauthSlug(slug);
      slug.offset += response.blogs.length;
      items.totalFollowingCount = response.total_blogs;
      items.cachedFollowingCount += response.blogs.length;
      const transaction = db.following.bulkPut(response.blogs);
      transaction.then(() => {
        deferred.resolve();
      });
    } else {
      resetOauthSlug(slug);
      deferred.reject('Response was empty, yo');
    }
    return deferred.promise();
  }
}
