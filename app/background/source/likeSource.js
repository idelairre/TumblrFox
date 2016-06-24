import { isEmpty } from 'lodash';
import $, { ajax, each, Deferred } from 'jquery';
import constants from '../constants';
import Source from './source';

const formatDate = date => {
  return new Date(date * 1000).toLocaleDateString();
};

class LikeSource extends Source {
  options = {
    page: null,
    timestamp: null,
    utilPage: null,
    untilTimestap: null
  };

  constructor() {
    super();
    this.constants.on('ready', ::this.initializeConstants);
    this.constants.on('reset', ::this.initializeConstants);
  }

  initializeConstants() {
    this.options.timestamp = this.constants.get('nextSlug').timestamp;
    this.options.page = this.constants.get('nextSlug').page;
  }

  start(retry, options) {
    if (options) {
      Object.assign(this.options, options);
    }
    return super.start(retry);
  }

  async run(retry) {
    const deferred = Deferred();
    try {
      if (this.options.timestamp <= this.options.untilTimestamp || this.options.page >= this.options.untilPage) {
        deferred.resolve([]);
      }
      const posts = await this.crawlPosts(retry);
      this.retriedTimes = 0;
      deferred.resolve(posts);
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

  async fetch() {
    const deferred = Deferred();
    let url = 'https://www.tumblr.com/likes';
    if (this.options.page) {
      url += `/page/${this.options.page}`;
    }
    if (this.options.timestamp) {
      url += `/${this.options.timestamp}`;
    }
    ajax({
      type: 'GET',
      url,
      success: data => {
        try {
          let next = $(data).find('#pagination').find('a#next_page_link').attr('href').split('/');
          next = next[next.length - 1];
          this.options.page += 1;
          this.options.timestamp = next;
          constants.set('nextSlug', {
            timestamp: this.options.timestamp,
            page: this.options.page
          });
          const posts = this.parsePosts(data);
          deferred.resolve(posts);
        } catch (e) {
          deferred.reject(e);
        }
      },
      error: error => {
        console.error('[ERROR]', error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  async fetchMostRecent() {
    const deferred = Deferred();
    ajax({
      type: 'GET',
      url: 'https://www.tumblr.com/likes',
      success: data => {
        const posts = this.parsePosts(data);
        deferred.resolve(posts);
      },
      error: error => {
        console.error('[ERROR]', error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  async crawlPosts(retry) {
    const deferred = Deferred();
    try {
      if (retry && this.retriedTimes && this.retriedTimes <= this.retryTimes) {
        console.log(`Retried times: ${this.retriedTimes + 1}, retrying posts from page: ${this.options.page}, timestamp: ${formatDate(this.options.timestamp)}...`);
      }
      const posts = await this.fetch(retry);
      console.log(`✔ Crawled posts from page: ${this.options.page}, timestamp: ${formatDate(this.options.timestamp)}`);
      deferred.resolve(posts);
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  processPost(postHtml, timestamp) {
    const post = $(postHtml).data('json');
    post.id = parseInt(post.id, 10);
    post.html = $(postHtml).prop('outerHTML');
    if (timestamp) {
      post.liked_timestamp = parseInt(timestamp, 10);
    }
    post.tags = this.processTags(postHtml) || [];
    post.note_count = $(postHtml).find('.note_link_current').data('count') || 0;
    post.blog_name = post.tumblelog;
    return post;
  }

  processTags(post) {
    const tagElems = $(post).find('.post_tags');
    if (tagElems && tagElems.length > 0) {
      const rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#').filter(tag => {
        if (tag !== '') {
          return tag;
        }
      });
      return rawTags;
    }
  }

  parsePosts(data) {
    try {
      const postsJson = [];
      const posts = $(data).find('[data-json]').not('[data-is-radar]');
      each(posts, (i, post) => {
        post = this.processPost(post, this.options.timestamp);
        if (post.id) {
          postsJson.push(post);
        }
      });
      return postsJson;
    } catch (e) {
      console.error(e);
    }
  }
}

const source = new LikeSource();

export default source;
