import { has, last } from 'lodash';
import $, { ajax, Deferred } from 'jquery';
import Source from 'tumblr-source';
import { debug } from '../services/loggingService';
import constants from '../constants';
import fetch from '../utils/fetch';
import parsePosts from '../utils/parsePosts';
import formatDate from '../utils/formatDate';

class LikeSource extends Source {
  options = {
    url: 'https://www.tumblr.com/likes',
    item: 'posts',
    iterator: 'page',
    timestamp: null,
    page: null,
    untilTimestamp: new Date(2007, 1, 1),
    untilPage: 'max'
  };

  fetch() {
    return fetch.call(this, arguments);
  }

  load() {
    this.constants = constants;
    constants.once('ready', () => {
      Object.assign(this.options, this.constants.get('likeSourceLimits'));
      Object.assign(this.options, this.constants.get('nextLikeSourceSlug'));
    });
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
    
    this.constants.set('nextLikeSourceSlug', {
      timestamp: this.options.timestamp,
      page: this.options.page,
      url: this.options.url
    });
  }

  parse(response) {
    try {
      const pagination = $(response).find('#pagination');
      if (pagination) {
        let link = pagination.find('a#next_page_link');
        if (link && link.attr('href')) {
          let next = last(link.attr('href').split('/')); // TODO: make this fail more gracefully
          this.options.page += 1;
          if (has(this.options, 'timestamp')) { // this doesn't work for blog posts
            this.options.timestamp = next;
            return parsePosts(response, this.options.timestamp);
          }
          return parsePosts(response);
        }
      }
      return [];
    } catch (err) {
      console.error(err);
      this.constants.set('maxLikesCount', this.constants.get('cachedLikesCount'));
    }
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
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }
}

const source = new LikeSource();

export default source;
