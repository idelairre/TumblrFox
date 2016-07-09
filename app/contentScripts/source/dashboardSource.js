module.exports = (function (Tumblr, Backbone, _, $, BlogSource, ChromeMixin, Source) {
  const { extend, findIndex, omit, pick } = _;
  const { Utils } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;

  const b64EncodeUnicode = str => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode('0x' + p1);
    }));
  }

  const b64DecodeUnicode = str => {
    return decodeURIComponent(Array.prototype.map.call(atob(str), c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  const DashboardSource = Source.extend({
    mixins: [ChromeMixin],
    initialize() {
      this.streamCursor = $('#next_page_link').data('stream-cursor') || '';
      this.endPoint = '/svc/post/dashboard';
    },
    collateData(response) {
      return BlogSource.collateData(response).then(posts => {
        return BlogSource._handleCollatedData(posts);
      });
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
    search(query) { // NOTE: slit this up into one block of requests per 100 users
      const deferred = $.Deferred();
      const following = Tumblelog.collection.where({
        following: true
      });
      const promises = following.map(follower => {
        query.blogname = follower.get('name');
        query.limit = 1;
        return BlogSource.search(query);
      });
      $.when.apply($, promises).done((...posts) => {
        const results = [].concat(...posts).filter(data => {
          if (typeof data !== 'undefined' && data.response.posts.length !== 0) {
            return data;
          }
        });
        results.forEach(data => {
          if (data.response.posts[0]) {
            BlogSource._fetchTumblelogs(data.response.posts[0]).then(() => {
              Tumblr.Fox.Events.trigger('fox:search:postFound', data.response.posts[0]);
            });
            return data.response.posts[0];
          }
        });
        deferred.resolve(results);
      });
      return deferred.promise();
    },
    clientFetch(streamCursor) {
      const deferred = $.Deferred();
      let nextPage = window.next_page.replace('/dashboard', '/svc/dashboard');

      if (!streamCursor) {
        streamCursor = this.streamCursor;
      } else {
        streamCursor = b64EncodeUnicode(JSON.stringify(streamCursor));
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

  Tumblr.Fox.register('DashboardSource', DashboardSource);

});
