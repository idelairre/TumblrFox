import async from 'async';
import { isEmpty } from 'lodash';
import $, { ajax, Deferred } from 'jquery';
import constants from '../constants';

const formatDate = (date) => {
  return new Date(date * 1000).toLocaleDateString();
}

class Source {
  options = {
    page: null,
    timestamp: null,
    retryTimes: 3,
    retriedTimes: 0,
  };

  constructor() {
    this.initialized = false;
    constants.addListener('ready', () => {
      console.log(`Total posts: ${constants.get('totalPostsCount')}`);
      if (!isEmpty(constants.get('nextSlug'))) {
        this.options.timestamp = constants.get('nextSlug').timestamp;
        this.options.page = constants.get('nextSlug').page;
      }
      this.initialized = true;
    });
  }

  start(retry) {
    // console.log('Downloading liked posts...');
    if (this.initialized) {
      return this._run(retry);
    } else {
      constants.addListener('ready', () => {
        return this._run(retry);
      });
    }
  }

  async _run(retry) {
    const deferred = Deferred();
    try {
      const posts = await this.crawlPosts(retry);
      this.options.retriedTimes = 0;
      deferred.resolve(posts);
    } catch (error) {
      console.error('Code: \'%s\', Message: \'%s\'', error.status, error.statusText);
      if (this.options.retriedTimes <= (this.options.retryTimes - 1)) {
        if (this.options.retryTimes - this.options.retriedTimes) {
          console.log(`Retry in 3s... will retry ${this.options.retryTimes - this.options.retriedTimes} more time(s)`);
        } else {
          console.log('Retry in 3s...');
        }
        setTimeout(() => {
          this.options.retriedTimes += 1;
          return this._run(true);
        }, 3000);
      } else {
        console.info('Max retries reached, either there is a connection error or you have reached the maximum posts you can fetch.');
        deferred.reject(error);
      }
    }
    return deferred.promise();
  }

  async fetch(retry) {
    const deferred = Deferred();
    let url = 'https://www.tumblr.com/likes';
    if (this.options.page) {
      url += `/page/${this.options.page}`;
    }
    if (this.options.timestamp) {
      url += `/${this.options.timestamp}`;
    }
    // console.log('[FETCHING BEFORE]', new Date(this.options.timestamp * 1000));
    ajax({
      type: 'GET',
      url,
      success: data => {
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
      },
      error: error => {
        console.error('[ERROR]', error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  async crawlPosts(retry) {
    if (retry && this.options.retriedTimes && this.options.retriedTimes <= this.options.retryTimes) {
      console.log(`Retried times: ${this.options.retriedTimes - 1}, retrying posts from page: ${this.options.page}, timestamp: ${formatDate(this.options.timestamp)}...`);
    } else {
      console.log(`Crawling posts from page: ${this.options.page}, timestamp: ${formatDate(this.options.timestamp)}...`);
    }
    const posts = await this.fetch(retry);
    console.log(`✔ Crawled posts from page: ${this.options.page}, timestamp: ${formatDate(this.options.timestamp)}`);
    return posts;
  }

  processPost(postHtml, timestamp) {
    const post = $(postHtml).data('json');
    post.id = parseInt(post.id, 10);
    post.html = $(postHtml).prop('outerHTML') //.replace(/"/g, '\\\"');
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
        if (tag === '') {
          return;
        }
        return tag;
      });
      return rawTags;
    }
  }

  parsePosts(data) {
    try {
      const postsJson = [];
      let posts = $(data).find('[data-json]');
      $.each(posts, (i, post) => {
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

const source = new Source();

export default source;
