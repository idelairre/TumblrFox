module.exports = (function dashboardModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, trim } = _;
  const { Posts, Utils } = Tumblr.Fox;

  const DashboardModel = Model.extend({
    defaults: {
      heartbeat: 1000
    },
    initialize(e) {
      this.options = assign({}, this.defaults, e);
      this.state = Tumblr.Fox.state;
      this.posts = [];
      this.initializeSearch();
    },
    initializeSearch() {
      // NOTE: remember to set state
      $.each($('[data-pageable]'), (i, postView) => {
        const post = {
          html: $(postView).html()
        };
        this.posts.push(post);
      });
      this.posts.map(Utils.PostFormatter.parseTags);
    },
    query(slug) {
      return this.posts.filter(post => {
        if (post.type === slug.type) {
          return post;
        }
      });
    },
    fetch() {
      const deferred = $.Deferred();
      $.ajax({
        type: 'GET',
        url: window.next_page.replace('/dashboard', '/svc/dashboard'),
        data: {
          stream_cursor: $('[data-stream-cursor]').data('stream-cursor'),
          nextAdPos: 0
        },
        beforeSend: () => {
          window.loading_next_page = true;
        }
      }).success((data, status, xhr) => {
        const { response } = data;
        xhr.getResponseHeader('X-next-page');
        window.next_page = data.meta.tumblr_old_next_page;
        window.loading_next_page = false;
        if (typeof window.after_auto_paginate === 'function') {
          window.after_auto_paginate();
        }
        Tumblr.AutoPaginator.flushQueue();
        Tumblr.Events.trigger('after', window.next_page);
        const posts = data.response.DashboardPosts.body;
        this.posts.concat(Utils.PostFormatter.renderDashboardPosts(posts));
        deferred.resolve(data.response.DashboardPosts.body);
      }).error(error => {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    queue() {
      let queue = $.Deferred();
      this.waitJob = queue;
      const addJob = newJob => {
        queue = queue.then(newJob).then(() => {
          this.waitJob = $.Deferred();
          return this.waitJob;
        });
      }
      setInterval(() => {
        if (window.loading_next_page === false) {
          addJob(::this.fetch);
        }
      }, this.options.heartbeat);
      setInterval(() => {
        this.resolvePending();
      }, this.options.heartbeat + 1000);
    },
    resolvePending() {
      this.waitJob.resolve();
    },
    start() {
      setInterval(() => {
        this.resolvePending();
      }, this.options.heartbeat);
    },
    search(query) {
      const deferred = $.Deferred();
      const results = [];
      Tumblr.Events.trigger('fox:disablePagination');
      if (query.term.length === 0) {
        deferred.resolve(this.posts);
      } else {
        this.posts.map(post => { // TODO: make sure to filter by other query parameters
          if (typeof post.get === 'function') {
            if (post.get('tags').includes(query.term)) {
              results.push(post);
            }
          } else {
            if (post.tags.includes(query.term)) {
              results.push(post);
            }
          }
        });
        deferred.resolve(results);
      }
      return deferred.promise();
    }
  });

  Tumblr.Fox.Dashboard = DashboardModel;
});
