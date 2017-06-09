import $ from 'jquery';
import { chunk, compact, extend, flatten, isFunction, omit, pick } from 'lodash';
import BlogSource from './blogSource';
import ChromeMixin from '../components/mixins/chromeMixin';
import Events from '../application/events';
import Source from './source';
import Utils from '../utils';

const { Tumblelog } = Tumblr.Prima.Models;

const DashboardSource = Source.extend({
  mixins: [ChromeMixin],
  initialize() {
    this.firstPage = `https://www.tumblr.com/dashboard/1/${$('.post').first().data('id')}`;
    this.firstCursor = $('#next_page_link').data('stream-cursor') || '';
    this.streamCursor = this.firstCursor;
    this.following = Tumblelog.collection.toJSON();
    this.bindEvents();
  },
  reset() {
    window.next_page = this.firstPage;
    this.streamCursor = this.firstCursor;
  },
  bindEvents() {
    $(document).ajaxSuccess((event, xhr, settings) => {
      if (settings.url.includes('/svc/dashboard/')) {
        this.streamCursor = xhr.responseJSON.response.DashboardPosts.nextCursor;
      }
    });
    this.listenTo(Events, 'fox:update:following', ::this.updateFollowing);
  },
  updateFollowing() {
    this.following = Tumblelog.collection.toJSON();
  },
  collateData(posts) {
    return BlogSource.collateData(posts).then(response => {
      return response;
    });
  },
  fetch(query) {
    const deferred = $.Deferred();
    let slug = pick(query, 'next_offset', 'filter_nsfw', 'limit', 'post_type', 'post_role', 'sort');

    if (query.post_type === 'ANY') {
      slug = omit(slug, 'post_type');
    }

    this.chromeTrigger('chrome:fetch:dashboardPosts', slug, response => {
      if (response) {
        this.collateData(response).then(deferred.resolve);
      } else {
        deferred.reject();
      }
    });
    return deferred.promise();
  },
  search(query) {
    // break up requests into lots of 12
    // wait until last request is done
    // start new request

    if (Tumblr.Fox.options.get('test')) {
      this.following = this.following.slice(0, 36);
    }

    const deferred = $.Deferred();
    const chunked = chunk(this.following, 12);

    const results = chunked.reduce((acc, followers, i) => {
      return acc = acc.concat($.Deferred(({ resolve, reject }) => {
        setTimeout(() => {
          const promises = followers.map(follower => {
            query.blogname = isFunction(follower.get) ? follower.get('name') : follower.name;
            query.limit = 1;

            return BlogSource.search(query).then(data => {
              if (data.response.posts.length > 0) {
                Events.trigger('fox:search:postFound', data.response.posts[0]);
                return data.response.posts[0];
              }
            }).fail(reject);
          });
          resolve(Promise.all(promises).catch(console.error));
        }, i * 500);
      }));
    }, []);

    Promise.all(results).then(response => {
      deferred.resolve(compact(flatten(response))); // welcome to lodash hell
    });

    return deferred.promise();
  },
  clientFetch(streamCursor) {
    const deferred = $.Deferred();
    let nextPage = window.next_page.replace('/dashboard', '/svc/dashboard');

    if (!streamCursor) {
      streamCursor = this.streamCursor;
    } else {
      streamCursor = Utils.B64.encodeUnicode(JSON.stringify(streamCursor));
    }

    Backbone.ajax({
      url: nextPage,
      type: 'GET',
      data: {
        nextAdPos: 0,
        stream_cursor: streamCursor
      },
      success: data => {
        window.next_page = data.meta.tumblr_old_next_page;
        this.streamCursor = data.response.DashboardPosts.nextCursor;
        const posts = Utils.PostFormatter.formatDashboardPosts(data.response.DashboardPosts.body);

        if (typeof window.after_auto_paginate === 'function') {
          window.after_auto_paginate();
        }

        deferred.resolve(posts);
      },
      error: error => {
        console.error(error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }
});

extend(DashboardSource.prototype, Backbone.Events);

module.exports = new DashboardSource();
