import async from 'async';
import { isEmpty } from 'lodash';
import Source from './source';
import $, { ajax, Deferred } from 'jquery';
import constants from '../constants';

const formatDate = (date) => {
  return new Date(date * 1000).toLocaleDateString();
}

class PostSource extends Source {
  options = {
    page: null,
    timestamp: null,
  };

  constructor() {
    super();
    this.constants.addListener('ready', ::this.initializeConstants);
    this.constants.addListener('reset', ::this.initializeConstants);
  }

  initializeConstants() {
    if (!isEmpty(this.constants.get('nextSlug'))) {
      this.options.timestamp = this.constants.get('nextSlug').timestamp;
      this.options.page = this.constants.get('nextSlug').page;
    }
  }

  async _run(retry) {
    const deferred = Deferred();
    try {
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

  async fetch(retry) {
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
    if (retry && this.retriedTimes && this.retriedTimes <= this.retryTimes) {
      console.log(`Retried times: ${this.retriedTimes + 1}, retrying posts from page: ${this.options.page}, timestamp: ${formatDate(this.options.timestamp)}...`);
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

const source = new PostSource();

export default source;