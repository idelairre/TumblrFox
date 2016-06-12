module.exports = (function dashboardModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, omit } = _;
  const { extend, get, Utils } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  /**
  * Dashboard filter states:
  * no tag / no filter / no filter options => default tumblr behavior
  * no tag / no filter / filter options => default tumble behavior + filter posts as they are added
  * no tag / filter / filter options => fetch posts from api + filter posts as they are added
  * no tag / filter / no filter options => fetch filtered posts from api
  * tag selected / no filter / no filter options => select from dashboard posts + disable pagination
  * tag selected / filter / no filter options => select from filtered dashboard posts + disable pagination
  * tag selected / filter / filter options => select from filtered dashboard posts + disable pagination
  * ...
  */

  const DashboardModel = Model.extend({
    mixins: [ChromeMixin],
    initialize(e) {
      this.attributes = assign({}, this.defaults, omit(e, ['slug', 'state', 'filter']));
      this.filter = e.filter;
      this.state = e.state;
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
    applyFilter(model) {
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
      if (slug.type === 'any') {
        slug = omit(slug, 'type');
      }
      this.chromeTrigger('chrome:fetch:posts', slug, deferred.resolve);
      return deferred.promise();
    },
    // NOTE: when posts are removed from the DOM Tumblr reduces pictures to 1x1 pixel with no content,
    // this means that the model will be forced to re-fetch them
    search(query) {
      const deferred = $.Deferred();
      let results = [];
      this.posts.map(post => { // TODO: make sure to filter by other query parameters
        if (post.model.get('tags').includes(query.term)) {
          results.push(post);
        }
      });
      if (query.post_type !== 'ANY') {
        results = results.filter(post => {
          if (post.model.get('type') === query.post_type.toLowerCase()) {
            return post;
          }
        });
      }
      if (query.post_role === 'ORIGINAL') {
        results = results.filter(post => {
          if (!post.model.get('is-reblog')) {
            return post;
          }
        });
      }
      if (query.filter_nsfw) {
        results = results.filter(post => {
          if (!post.model.get('tumblelog-content-rating') === 'adult' || !post.model.get('tumblelog-content-rating') === 'nsfw') {
            return post;
          }
        });
      }
      deferred.resolve(results);
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('DashboardModel', DashboardModel);
});
