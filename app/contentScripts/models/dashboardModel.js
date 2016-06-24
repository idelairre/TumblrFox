module.exports = (function dashboardModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, pick, take, union } = _;
  const { Utils } = Tumblr.Fox;
  const { DashboardSource } = Tumblr.Fox.Source;

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
    filteredFetch() {
      return DashboardSource.fetch(query).then(response => {
        return this._applyFilter(query, response);
      });
    },
    fetch(query) {
      let posts = [];
      const deferred = $.Deferred();
      const filteredFetch = () => {
        return DashboardSource.fetch(query).then(response => {
          return this._applyFilter(query, response);
        });
      }
      const recursiveFetch = posts => {
        return filteredFetch().then(response => {
          posts = take(posts.concat(response), query.limit);
          // console.log('[DASHBOARD]: fetched ', posts.length, 'need:', query.limit - posts.length);
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
    _applyFilter(query, posts) {
      return posts.filter(post => {
        if (query.post_role === 'ORIGINAL' && post.hasOwnProperty('reblogged_from_name')) {
          return;
        }
        return post;
      });
    }
  });

  Tumblr.Fox.register('DashboardModel', DashboardModel);
});
