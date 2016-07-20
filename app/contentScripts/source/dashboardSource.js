import { $ } from 'backbone';
import { extend, findIndex, omit, pick, sortBy } from 'lodash';
import BlogSource from './blogSource';
import ChromeMixin from '../components/mixins/chromeMixin';
import Events from '../application/events';
import Source from './source';
import Utils from '../utils';

const { Tumblelog } = Tumblr.Prima.Models;

const DashboardSource = Source.extend({
  mixins: [ChromeMixin],
  initialize() {
    this.streamCursor = $('#next_page_link').data('stream-cursor') || '';
    this.endPoint = '/svc/post/dashboard';
    this.following = Tumblelog.collection.toJSON();
    this.bindEvents();
  },
  bindEvents() {
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
        this.collateData(response).then(posts => {
          deferred.resolve(posts);
        });
      }
    });
    return deferred.promise();
  },
  search(query) {
    if (Tumblr.Fox.options.get('test')) {
      this.following = this.following.slice(0, 10);
    }
    const deferred = $.Deferred();
    const promises = this.following.map(follower => {
      query.blogname = typeof follower.get === 'function' ? follower.get('name') : follower.name;
      query.limit = 1;
      return BlogSource.search(query).then(data => {
        if (data.response.posts.length > 0) {
          BlogSource._fetchTumblelogs(data.response.posts[0]).then(() => {
            if (!Tumblr.Fox.options.get('test')) {
              Events.trigger('fox:search:postFound', data.response.posts[0]);
            }
          });
        }
        return data.response.posts[0];
      });
    });
    $.when.apply($, promises).always((...results) => {
      const posts = [].concat(...results).filter(post => {
        if (typeof post !== 'undefined') {
          return post;
        }
      });
      deferred.resolve(posts);
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
