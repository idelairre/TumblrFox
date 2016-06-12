module.exports = (function postModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, cloneDeep, isEmpty, invoke } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;
  const { get, Utils } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  // NOTE: this strikes me as a "super model", maybe thin this out?
  // TODO: 1. redirect to dashboard if the route is other than the dashboard
  //       2. thin this the fuck out

  const PostsModel = Model.extend({
    id: 'Posts',
    mixins: [ChromeMixin],
    dependencies: Utils.ComponentFetcher.getAll(['AutoPaginatorModel', 'BlogModel', 'DashboardModel', 'LikesModel', 'LoaderComponent', 'StateModel']),
    defaults: {
      loading: false,
      slug: {
        type: null,
        offset: 0,
        limit: 12
      }
    },
    initialize(options) {
      const { AutoPaginatorModel, BlogModel, DashboardModel, LikesModel, LoaderComponent, StateModel } = this.dependencies;
      this.slug = new Model(this.defaults.slug);
      this.state = Tumblr.Fox.state;
      this.autopaginator = new AutoPaginatorModel({
        posts: this
      });
      this.blogModel = new BlogModel({
        blogSearch: options.blogSearch,
        state: this.state
      });
      this.dashboardModel = new DashboardModel({
        slug: this.slug,
        state: this.state,
        filter: options.blogSearch
      });
      this.likesModel = new LikesModel({
        state: this.state
      });
      this.loader = new LoaderComponent({
        el: $('#auto_pagination_loader_loading')
      });
      this.$$matches = [];
      this.set('loading', false);
      this.bindEvents();
      return this;
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'indashblog:search:complete', ::this.initialBlogSearch); // add posts to collection
      this.listenTo(Tumblr.Events, 'fox:apiFetch:initial', ::this.initialDashboardFetch); // filter posts, fetch posts from api
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.unbindEvents);
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.flushMatches);
      this.listenTo(Tumblr.Events, 'fox:toggleLoading', ::this.toggleLoading);
    },
    unbindEvents() {
      this.stopListening();
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.bindEvents);
    },
    flushMatches() {
      this.$$matches = []; // not sure how this is going to work here on in
    },
    fetch() {
      switch(this.state.getState()) {
        case 'user':
          return this.blogFetch();
          break;
        case 'dashboard':
          return this.dashboardFetch(this.slug.attributes);
          break;
        case 'likes':
          return this.renderSearchResults();
          break;
      }
    },
    search(query) {
      console.log('[APP STATE]', this.state.getState());
      const deferred = $.Deferred();
      if (this.get('loading')) {
        return deferred.reject('Error: loading');
      }
      this.filterPosts().then(() => {
        switch(this.state.getState()) {
          case 'likes':
            this.toggleLoading(true);
            this.likesModel.search(query).then(results => {
              this.$$matches = results;
              this.slug.set('offset', this.slug.get('offset') + this.slug.get('limit')); // NOTE: it would probably be better to send for this with the offset rather than store the results
              this.toggleLoading(false);
              results = results.slice(0, this.slug.get('limit'));
              Utils.PostFormatter.renderPostsFromHtml(results);
              Tumblr.Events.trigger('fox:searchFinished');
              deferred.resolve();
            });
            break;
          case 'user':
            this.blogFetch().then(() => {
              Tumblr.Events.trigger('fox:searchFinished');
              deferred.resolve();
            })
            break;
          case 'dashboard':
            this.toggleLoading(true);
            if (this.blogModel.get('term').length > 0) {
              if (this.autopaginator.get('enabled') || this.autopaginator.get('defaultPaginationEnabled')) {
                this.autopaginator.disableAll();
              }
            }
            this.dashboardModel.search(query).then(results => {
              this.toggleLoading(false);
              Utils.PostFormatter.renderDashboardPosts(results);
              Tumblr.Events.trigger('fox:searchFinished');
              deferred.resolve();
            });
            break;
        }
      });
      return deferred.promise();
    },
    dashboardFetch() {
      if (this.get('loading')) {
        return;
      }
      if (!this.autopaginator.get('enabled')) {
        this.autopaginator.start();
      }
      this.toggleLoading(true);
      return this.dashboardModel.fetch(this.slug.attributes).then(response => {
        this.blogModel.collateData(response.posts).then(posts => {
          this.slug.set('offset', this.slug.get('offset') + posts.length);
          Utils.PostFormatter.renderPosts(posts);
          this.toggleLoading(false);
        });
      });
    },
    initialDashboardFetch(type) {
      if (this.get('loading')) {
        return;
      }
      this.slug.set('type', type);
      if (this.autopaginator.get('defaultPaginationEnabled')) {
        this.autopaginator.disableDefaultPagination();
      }
      this.filterPosts().then(() => {
        if (this.blogModel.get('term').length > 0) {
          return this.search(this.blogModel.toJSON());
        }
        this.slug.set('offset', 0);
        return this.dashboardFetch();
      });
    },
    blogFetch() {
      if (this.get('loading')) {
        return;
      }
      const deferred = $.Deferred();
      if (this.blogModel.get('next_offset') !== -1) {
        this.toggleLoading(true);
        if (this.blogModel.get('term').length > 0) {
          this.blogModel.search().then(() => {
            setTimeout(() => {
              this.toggleLoading(false);
              deferred.resolve();
            }, 1000);
          });
        } else {
          this.blogModel.fetch().then(posts => {
            Utils.PostFormatter.renderPosts(posts);
            this.toggleLoading(false);
            deferred.resolve();
          });
        }
      }
      return deferred.promise();
    },
    initialBlogSearch(posts) {
      this.state.set('user', true);
      this.toggleLoading(true);
      this.filterPosts().then(() => {
        this.blogModel.initialIndashSearch(posts).then(posts => {
          Utils.PostFormatter.renderPosts(posts);
          this.toggleLoading(false);
        });
      });
    },
    renderSearchResults() {
      if (this.get('loading')) {
        return;
      }
      const deferred = $.Deferred();
      const opts = {
        offset: this.slug.get('offset'),
        limit: this.slug.get('limit')
      };
      const matches = this.$$matches.slice(opts.offset, opts.offset + opts.limit);
      if (isEmpty(matches)) {
        deferred.resolve();
        if (this.autopaginator.get('enabled')) {
          this.autopaginator.stop();
         }
      } else if (matches.length > 0) {
        this.toggleLoading(true);
        setTimeout(() => {
          Utils.PostFormatter.renderPostsFromHtml(matches);
          this.slug.set('offset', this.slug.get('offset') + this.slug.get('limit'));
          deferred.resolve();
          this.toggleLoading(false);
        }, 700);
      }
      return deferred.promise();
    },
    toggleLoading(val) {
      this.set('loading', val);
      this.loader.setLoading(this.get('loading'));
    },
    filterPosts(filterType) {
      const deferred = $.Deferred();
      if (filterType && filterType !== this.slug.get('type')) {
        this.slug.set('type', filterType);
        this.slug.set('offset', 0);
      }
      if (this.state.get('dashboard') && this.autopaginator.get('defaultPaginationEnabled')) {
        this.autopaginator.disableDefaultPagination();
      }
      $('li[data-pageable]').fadeOut(300);
      $('li[data-pageable]').promise().done(() => {
        $('.standalone-ad-container').remove();
        $('li[data-pageable]').remove();
        deferred.resolve();
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('PostsModel', PostsModel);
});
