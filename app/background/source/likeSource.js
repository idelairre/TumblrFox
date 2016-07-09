import { findKey, isEmpty } from 'lodash';
import $, { ajax, each, Deferred } from 'jquery';
import parsePosts from '../utils/parsePosts';
import formatDate from '../utils/formatDate';
import Source from './source';

class LikeSource extends Source {
  options = {
    url: 'https://www.tumblr.com/likes',
    item: 'liked posts',
    iterator: 'page',
    timestamp: null,
    page: null,
    untilTimestamp: new Date(2007, 1, 1),
    untilPage: 'max'
  };

  constructor() {
    super();
  }

  initializeConstants() {
    if (this.constants.get('likeSourceLimits')) {
      Object.assign(this.options, this.constants.get('likeSourceLimits'));
    }
    if (this.constants.get('likeSourceSlug')) {
      Object.assign(this.options, this.constants.get('likeSourceSlug'));
    }
  }

  condition() {
    return this.options.timestamp <= this.options.untilTimestamp || this.options.page >= this.options.untilPage;
  }

  step() {
    if (this.options.page) {
      this.options.url = `https://www.tumblr.com/likes/page/${this.options.page}`;
    }
    if (this.options.timestamp) {
      this.options.url += `/${this.options.timestamp}`;
    }
    this.constants.set('likeSourceSlug', {
      timestamp: this.options.timestamp,
      page: this.options.page,
      url: this.options.url
    });
  }

  parse(response) {
    let next = $(response).find('#pagination').find('a#next_page_link').attr('href').split('/');
    next = next[next.length - 1];
    this.options.page += 1;
    this.options.timestamp = next;
    return parsePosts(response, this.options.timestamp);
  }

  async fetchMostRecent() {
    const deferred = Deferred();
    ajax({
      type: 'GET',
      url: 'https://www.tumblr.com/likes',
      success: data => {
        const posts = parsePosts(data);
        deferred.resolve(posts);
      },
      error: error => {
        console.error('[ERROR]', error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  async crawl(retry) {
    const deferred = Deferred();
    try {
      if (retry && this.retriedTimes && this.retriedTimes <= this.retryTimes) {
        console.log(`Retried times: ${this.retriedTimes + 1}, retrying from page: ${this.options.page}, timestamp: ${formatDate(this.options.nextLikeSlug.timestamp)}...`);
      }
      const posts = await this.fetch(retry);
      console.log(`✔ Crawled posts from page: ${this.options.page}, timestamp: ${formatDate(this.options.timestamp)}`);
      deferred.resolve(posts);
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }
}

const source = new LikeSource();

export default source;
