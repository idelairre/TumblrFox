module.exports = (function dashboardSource(Tumblr, Backbone, _, $, BlogSource, ChromeMixin, Source) {
  const { extend, findIndex, omit, pick, sortBy } = _;
  const { Utils } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;


  const DashboardSource = Source.extend({
    mixins: [ChromeMixin],
    initialize() {
      this.streamCursor = $('#next_page_link').data('stream-cursor') || '';
      this.endPoint = '/svc/post/dashboard';
      this.following = Tumblelog.collection.sortBy('updated').filter(tumblelog => {
        return tumblelog.get('following');
      }).reverse();
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Fox.Events, 'fox:update:following', ::this.updateFollowing);
    },
    updateFollowing() {
      this.following = Tumblelog.collection.sortBy('updated').filter(tumblelog => {
        return tumblelog.get('following');
      }).reverse();
    },
    collateData(response) {
      return BlogSource.collateData(response);
    },
    fetch(query) {
      const deferred = $.Deferred();
      let slug = pick(query, 'next_offset', 'filter_nsfw', 'limit', 'post_type', 'post_role', 'sort');
      if (query.post_type === 'ANY') {
        slug = omit(slug, 'post_type');
      }
      this.chromeTrigger('chrome:fetch:dashboardPosts', slug, response => {
        this.collateData(response).then(posts => {
          deferred.resolve(posts);
        });
      });
      return deferred.promise();
    },
    search(query) {
      const promises = this.following.map(follower => {
        const deferred = $.Deferred();
        query.blogname = (typeof follower.get === 'function' ? follower.get('name') : follower.name);
        query.limit = 1;
        BlogSource.search(query).then(data => {
          if (data.response.posts[0]) {
            BlogSource._fetchTumblelogs(data.response.posts[0]).then(() => {
              Tumblr.Fox.Events.trigger('fox:search:postFound', data.response.posts[0]);
            });
          }
          deferred.resolve();
        });
        return deferred.promise();
      });
      return $.when.apply($, promises);
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

  Tumblr.Fox.register('DashboardSource', DashboardSource);

});
