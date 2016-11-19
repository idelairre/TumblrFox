import { findKey, isEmpty, last } from 'lodash';
import $, { ajax, each, Deferred } from 'jquery';
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
    Object.assign(this.options, this.constants.get('likeSourceLimits'));
    Object.assign(this.options, this.constants.get('nextLikeSourceSlug'));
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
      let link = $(response).find('#pagination').find('a#next_page_link');
      if (link) {
        let next = link.attr('href').split('/'); // TODO: make this fail more gracefully
        next = last(next);
        this.options.page += 1;
        if ({}.hasOwnProperty.call(this.options, 'timestamp')) { // this doesn't work for blog posts
          this.options.timestamp = next;
          return parsePosts(response, this.options.timestamp);
        }
        return parsePosts(response);
      } else {
        return [];
      }
    } catch (e) {
      console.error(e);
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
