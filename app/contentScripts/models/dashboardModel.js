module.exports = (function (Tumblr, Backbone, _, DashboardSource) {
  const { $, Model } = Backbone;
  const { assign, pick, take, union, last, first, uniq } = _;
  const { Utils } = Tumblr.Fox;

  const DashboardModel = Model.extend({
    initialize(options) {
      assign(this, pick(options, 'state'));
      if (this.state.get('disabled')) {
        return;
      }
      this.postViews = Tumblr.postsView;
      this.posts = this.postViews.postViews;
      this.initializeAttributes();
    },
    initializeAttributes() {
      this.posts.map(Utils.PostFormatter.parseTags);
      this.posts.map(post => {
        post.model.set('html', $(post.$el).prop('outerHTML'));
      });
    },
    dashboardFetch() {
      return DashboardSource.clientFetch();
    },
    filteredFetch() {
      return DashboardSource.fetch(query).then(response => {
        return this._applyFilter(query, response);
      });
    },
    fetch(query) {
      let posts = [];
      const deferred = $.Deferred();
      const filteredFetch = () => {
        if (query.post_type === 'ANY' && query.term.length === 0) {
          return DashboardSource.clientFetch().then(response => {
            return this._applyFilters(query, response);
          });
        }
        return DashboardSource.fetch(query).then(response => {
          return this._applyFilters(query, response);
        });
      }
      const recursiveFetch = posts => {
        return filteredFetch().then(response => {
          posts = take(posts.concat(response), query.limit);
          if (posts.length < query.limit) {
            query.next_offset += 15;
            return recursiveFetch(posts);
          } else {
            deferred.resolve({ posts, query });
          }
        });
      }
      recursiveFetch(posts);
      return deferred.promise();
    },
    search(query) {
      return DashboardSource.search(query);
    },
    _applyFilters(query, posts) {
      if (query.post_role === 'ORIGINAL') {
        posts = posts.filter(post => {
          if (post.hasOwnProperty('is_reblog') && post['is_reblog'] || post.hasOwnProperty('reblogged_from_name')) {
            return;
          }
          return post;
        });
      }
      if (query.filter_nsfw) {
        posts = posts.filter(post => {
          if (!post.hasOwnProperty('tumblelog-content-rating')) {
            return post;
          }
        });
      }
      return posts;
    }
  });

  Tumblr.Fox.register('DashboardModel', DashboardModel);

});
