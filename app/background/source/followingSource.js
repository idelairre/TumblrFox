import async from 'async';
import constants from '../constants';
import { Deferred } from 'jquery';
import { oauthRequest, resetOauthSlug } from '../lib/oauthRequest';
import Source from './source';
import 'babel-polyfill';

class FollowingSource extends Source {
  options = {
    url: `https://api.tumblr.com/v2/user/following`,
    limit: 20,
    offset: 0,
    cached: 0,
    total: 0
  }
  constructor() {
    super();
    constants.addListener('ready' , () => {
      this.options.offset = constants.get('cachedFollowingCount');
      this.options.total = constants.get('totalFollowingCount');
    });
  }

  start(retry, options) {
    if (options) {
      Object.assign(this.options, options);
    }
    return super.start(retry);
  }

  async _run(retry, refresh) {
    const deferred = Deferred();
    try {
      const following = await this.crawlFollowing(retry);
      this.retriedTimes = 0;
      deferred.resolve(following);
    } catch (error) {
      if (this.retriedTimes <= (this.retryTimes - 1)) {
        this.handleError(error);
      } else {
        console.info(this.MAX_RETRIES_MESSAGE);
        deferred.reject(error);
      }
    }
    return deferred.promise();
  }

  async _processFollowing(response) {
    const deferred = Deferred();
    if (response.blogs.length === 0) {
      deferred.reject(new Error('Response was empty'));
    }
    this.options.offset += this.options.limit;
    if (this.constants.get('totalFollowingCount') === 0) {
      this.constants.set('totalFollowingCount', response.total_blogs);
    }
    deferred.resolve(response.blogs);
    return deferred.promise();
  }

  async fetch() {
    const deferred = Deferred();
    if (this.options.offset > this.options.total) {
      deferred.reject(new Error('Invalid parameters'));
    }
    try {
      const slug = {
        url: this.options.url,
        limit: this.options.limit,
        offset: this.options.offset
      };
      const response = await oauthRequest(slug);
      const following = await this._processFollowing(response);
      deferred.resolve(following);
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  async crawlFollowing(retry) {
    if (retry && this.retriedTimes && this.retriedTimes <= this.retryTimes) {
      console.log(`Retried times: ${this.retriedTimes}, retrying following from offset: ${this.options.offset}...`);
    } else {
      console.log(`Crawling following from offset: ${this.options.offset}...`);
    }
    const following = await this.fetch(retry);
    console.log(`✔ Crawled following from offset: ${this.options.offset}`);
    return following;
  }
}

const source = new FollowingSource();

export default source;
