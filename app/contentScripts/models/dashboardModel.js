module.exports = (function dashboardModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, isEmpty, omit, pick } = _;
  const { get, Utils } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  const DashboardModel = Model.extend({
    mixins: [ChromeMixin],
    initialize(options) {
      assign(this, pick(options, ['state', 'filter']));
      this.postViews = Tumblr.postsView;
      this.posts = this.postViews.postViews;
      this.postViews.stopListening(Tumblr.AutoPaginator, 'after');
      this.initializeAttributes();
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.AutoPaginator, 'after', ::this.filterDashboard);
      this.listenTo(this.filter, 'change:filter_nsfw change:post_role', ::this.applyFilter);
    },
    filterDashboard() {
      this.postViews.$el.find('.standalone-ad-container').remove();
      if (this.filter.get('filter_nsfw')) {
        const posts = this.postViews.$el.find('[data-tumblelog-content-rating]');
        $.each(posts, (i, post) => {
          post = $(post);
          const rating = post.data('tumblelog-content-rating');
          if (rating === 'nsfw' || rating === 'adult') {
            post.remove();
          }
        });
      }
      this.postViews.createPosts();
    },
    initializeAttributes() {
      this.posts.map(Utils.PostFormatter.parseTags);
      this.posts.map(post => {
        post.model.set('html', $(post.$el).prop('outerHTML'));
      });
    },
    applyFilter() {
      if (this.filter.get('filter_nsfw')) {
        this.postViews.collection.whereBy({
          'tumblelog-content-rating': 'nsfw'
        }).invoke('dismiss');
      }
      if (this.filter.get('post_role') === 'ORIGINAL') {
        this.postViews.collection.whereBy({
          is_reblog: true
        }).invoke('dismiss');
      }
    },
    query(slug) {
      return this.posts.filter(post => {
        if (post.type === slug.type) {
          return post;
        }
      });
    },
    fetch(slug) {
      const deferred = $.Deferred();
      if (slug.post_type === 'ANY') {
        slug = omit(slug, 'post_type');
      }
      this.chromeTrigger('chrome:fetch:dashboardPosts', slug, deferred.resolve);
      return deferred.promise();
    },
    // NOTE: when posts are removed from the DOM Tumblr reduces pictures to 1x1 pixel with no content,
    // this means that the model will be forced to re-fetch them
    search(query) {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:following', query, followers => {
        followers = followers.slice(0, 100);
        const promises = followers.map(follower => {
          query.blogname = follower.name;
          return this._request(query);
        });
        $.when.apply($, promises).done((...posts) => {
          deferred.resolve([].concat(...posts));
        });
      });
      return deferred.promise();
    },
    _request(slug) {
      const deferred = $.Deferred();
      $.ajax({
        type: 'GET',
        url: `https://www.tumblr.com/svc/search/blog_search/${slug.blogname}/${slug.term}`,
        data: omit(slug, ['blogname', 'showOriginalPostsSwitch', 'showNsfwSwitch', 'term', 'themeParams', 'unsetTerm']),
        beforeSend: xhr => {
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        success: data => {
          if (isEmpty(data.response.posts)) {
            deferred.resolve([]);
            return;
          }
          Tumblr.Events.trigger('fox:search:postFound', data.response.posts[0]);
          deferred.resolve(data.response.posts[0]);
        },
        error: error => {
          deferred.reject(error);
        }
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('DashboardModel', DashboardModel);
});
