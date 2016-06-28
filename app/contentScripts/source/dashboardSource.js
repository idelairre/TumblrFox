module.exports = (function dashboardSource(Tumblr, Backbone, _) {
  const { $ } = Backbone;
  const { extend, findIndex, omit, pick } = _;
  const { get } = Tumblr.Fox;
  const { BlogSource } = Tumblr.Fox.Source;
  const ChromeMixin = get('ChromeMixin');

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

  const formatPosts = postData => {
    let posts = $(postData.trim());
    posts = Array.prototype.slice.call(posts.find('[data-json]:not(.image-ad, .video-ad)'));
    posts = posts.map(post => {
      postEl = $(post);
      post = postEl.data('json');
      post.html = postEl.parent().html();
      return post;
    });
    return posts;
  }

  const DashboardSource = function () {
    this.streamCursor = $('#next_page_link').data('stream-cursor') || '';
    this.endPoint = '/svc/post/dashboard';
  };

  extend(DashboardSource.prototype, {
    collateData(postIds) {
      const deferred = $.Deferred();
      const promises = postIds.map(id => {
        return this.fetchPost(id);
      });
      $.when.apply($, promises).done((...posts) => {
        deferred.resolve([].concat(...posts));
      });
      return deferred.promise();
    },
    fetch(query) {
      const deferred = $.Deferred();
      let slug = pick(query, 'next_offset', 'filter_nsfw', 'limit', 'post_type', 'post_role', 'sort');
      if (query.post_type === 'ANY') {
        slug = omit(slug, 'post_type');
      }
      this.chromeTrigger('chrome:fetch:dashboardPosts', slug, response => {
        BlogSource.collateData(response).then(response => {
          const results = [];
          response.forEach(item => {
            results.push(item.response.posts[0]);
          });
          deferred.resolve(results);
        });
      });
      return deferred.promise();
    },
    search(query) {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:following', query, followers => {
        followers = followers.slice(0, 200);
        const promises = followers.map(follower => {
          query.blogname = follower.name;
          query.limit = 1;
          return BlogSource.search(query).then(data => {
            if (data.response.posts.length > 0) {
              Tumblr.Fox.Events.trigger('fox:search:postFound', data.response.posts[0]);
            }
            return data;
          });
        });
        $.when.apply($, promises).done((...posts) => {
          const results = [].concat(...posts);
          deferred.resolve(results);
        });
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
          const posts = formatPosts(data.response.DashboardPosts.body);
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

  ChromeMixin.applyTo(DashboardSource.prototype);

  Tumblr.Fox.register('DashboardSource', DashboardSource);
});
