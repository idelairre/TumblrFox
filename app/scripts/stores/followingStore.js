/* global alert:true */
/* eslint no-undef: "error" */

import { Deferred } from 'jquery';
import async from 'async';
import db from '../lib/db';
import { oauthRequest, resetOauthSlug } from '../lib/oauthRequest';
import { log } from '../services/logging';
import constants from '../constants';
import 'babel-polyfill';

export default class Following {
  static async fetch(query, callback) {
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

  static preload(port) {
    const slug = {
      limit: 20,
      offset: constants.get('cachedFollowingCount') || 0
    };
    const items = {
      totalFollowingCount: constants.get('totalFollowingCount') || 0,
      cachedFollowingCount: constants.get('cachedFollowingCount') || 0
    };
    this._populateFollowing(slug, items, port);
  }

  static async sync() {
    const slug = {
      limit: 1,
      offset: 0
    };
    const response = await this._getFollowing(slug);
    db.following.put(response.blogs[0]);
  }

  static _getFollowing(slug) {
    slug.url = `https://api.tumblr.com/v2/user/following`;
    return oauthRequest(slug);
  }

  static _populateFollowing(slug, items, port) {
    if (items.totalFollowingCount === items.cachedFollowingCount) {
      alert('Done caching followers');
      port({
        action: 'processDone'
      });
    }
    async.whilst(() => {
      return items.totalFollowingCount === 0 || items.totalFollowingCount > items.cachedFollowingCount;
    }, async next => {
      try {
        const response = await this._getFollowing(slug);
        const nextSlug = {
          slug,
          response,
          items
        };
        await this._processFollowing(nextSlug);
        log('following', items, data => {
          constants.set('cachedFollowingCount', items.cachedFollowingCount);
          data.constants = constants;
          port(data);
          next(null);
        });
      } catch (e) {
        port({
          action: 'error',
          payload: e
        });
        next(e);
      }
    });
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
