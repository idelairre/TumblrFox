module.exports = (function postModel(Tumblr, Backbone, _) {
  const { $ } = Backbone;
  const { assign, invoke, pick } = _;
  const { get, Utils } = Tumblr.Fox;
  const Controller = get('ControllerModel');

  // NOTE: this strikes me as a "super model", maybe thin this out?
  // further, this doesn't really resemble a model, perhaps there
  // is a better way of organizing this thing??
  // TODO: 1. redirect to dashboard if the route is other than the dashboard
  //       2. thin this the fuck out

  const PostsModel = Controller.extend({
    id: 'Posts',
    models: {
      blogModel: {
        constructor: get('BlogModel'),
        options: opts => {
          return {
            blogSearch: opts.blogSearch,
            state: opts.state
          };
        }
      },
      dashboardModel: {
        constructor: get('DashboardModel'),
        options: opts => {
          return {
            state: opts.state,
            filter: opts.blogSearch
          };
        }
      },
      likesModel: {
        constructor: get('LikesModel'),
        options: opts => {
          return {
            state: opts.state
          };
        }
      },
      searchModel: {
        constructor: get('SearchModel'),
        options: opts => {
          return {
            state: opts.state
          };
        }
      }
    },
    dependencies: ['AutoPaginatorModel', 'LoaderComponent', 'SearchResultsComponent'],
    defaults: {
      loading: false,
      searching: false
    },
    initialize(options) {
      assign(this, pick(options, ['state', 'searchOptions']));
      const { AutoPaginatorModel, LoaderComponent, SearchResultsComponent } = Utils.ComponentFetcher.getAll(this.dependencies);
      this.autopaginator = new AutoPaginatorModel({
        posts: this
      });
      this.loader = new LoaderComponent({
        el: $('#auto_pagination_loader_loading')
      });
      this.searchResults = new SearchResultsComponent({
        blogModel: this.blogModel
      });
      this.set(this.defaults);
      this.slug = this.blogModel.toJSON();
      this.wrapDashboardMethods();
      this.bindEvents();
      return this;
    },
    wrapDashboardMethods() {
      // wrap dashboard so that it automatically collates results, this is temporary
      const dashboardFetch = this.dashboardModel.fetch.bind(this.dashboardModel);
      this.dashboardModel.fetch = query => {
        return dashboardFetch(query).then(response => {
          return this.blogModel.collateData(response.posts);
        });
      };
    },
    setSlug() {
      this.slug = this.blogModel.toJSON();
    },
    resetSlug() {
      this.blogModel.set('next_offset', 0);
      this.setSlug();
    },
    incrementOffset() {
      this.blogModel.set('next_offset', this.blogModel.get('next_offset') + this.blogModel.get('limit'));
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:apiFetch:initial', ::this.initialDashboardFetch); // filter posts, fetch posts from api
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.unbindEvents);
      this.listenTo(Tumblr.Events, 'fox:toggleLoading', ::this.toggleLoading);
      this.listenTo(this.blogModel, 'change', ::this.setSlug);
    },
    unbindEvents() {
      this.stopListening();
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.bindEvents);
    },
    fetch() { // NOTE: watch this since the breaks have been removed
      switch (this.state.getState()) {
        case 'user':
          return this.blogFetch();
        case 'dashboard':
          if (this.blogModel.get('term') && this.blogModel.get('term').length > 0) {
            return this.renderSearchResults();
          }
          return this.dashboardFetch(this.slug);
        case 'likes':
          return this.renderSearchResults();
      }
    },
    search(query) {
      const deferred = $.Deferred();
      if (this.get('loading')) {
        return deferred.reject('Error: loading');
      }
      Tumblr.Events.trigger('fox:search:started');
      this.searching = true;
      this.renderedResults = false;
      this.resetSlug();
      this.filterPosts().then(() => {
        switch (this.state.getState()) {
          case 'likes':
            this.toggleLoading(true);
            this.likesModel.search(query).then(results => {
              this.searching = false;
              this.searchModel.matches.set(results);
              Utils.PostFormatter.renderPostsFromHtml(results.slice(0, this.slug.limit));
              Tumblr.Events.trigger('fox:search:finished', results);
              this.toggleLoading(false);
              this.incrementOffset();
              deferred.resolve();
            });
            break;
          case 'user':
            this.blogFetch().then(() => {
              this.searching = false;
              // NOTE: fox:search:finished is called by the blogModel and passes posts to search model
              deferred.resolve();
            });
            break;
          case 'dashboard':
            this.loader.show(); // want to keep the loader status decouped from posts model so results can be rendered
            setTimeout(() => {
              this.autopaginator.start();
            }, 500);
            this.dashboardModel.search(query).then(results => {
              this.searching = false;
              Tumblr.Events.trigger('fox:search:finished', results);
              this.loader.hide();
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
      return this.dashboardModel.fetch(this.blogModel.toJSON()).then(posts => {
        this.blogModel.set('next_offset', this.blogModel.get('next_offset') + posts.length);
        Utils.PostFormatter.renderPosts(posts, true);
        this.toggleLoading(false);
      });
    },
    initialDashboardFetch(type) {
      if (this.get('loading')) {
        return;
      }
      this.blogModel.set('post_type', type);
      if (this.autopaginator.get('defaultPaginationEnabled')) {
        this.autopaginator.disableDefaultPagination();
      }
      if (!this.autopaginator.get('enabled')) {
        this.autopaginator.start();
      }
      this.filterPosts().then(() => {
        this.blogModel.set('next_offset', 0);
        if (this.blogModel.get('term') && this.blogModel.get('term').length > 0) {
          return this.search(this.blogModel.toJSON());
        }
        return this.dashboardFetch(this.blogModel.toJSON());
      });
    },
    blogFetch() {
      if (this.get('loading')) {
        return;
      }
      if (this.blogModel.get('next_offset') === -1) {
        Tumblr.Events.trigger('fox:search:finished');
        return;
      }
      if (this.autopaginator.get('defaultPaginationEnabled')) {
        this.autopaginator.disableDefaultPagination();
      }
      if (!this.autopaginator.get('enabled')) {
        this.autopaginator.start();
      }
      const deferred = $.Deferred();
      this.toggleLoading(true);
      if (this.blogModel.get('term').length > 0) { // NOTE: fucks up here
        this.blogModel.search();
        setTimeout(() => {
          this.toggleLoading(false);
        }, 500);
        deferred.resolve();
      } else {
        this.blogModel.fetch(this.slug).then(posts => {
          Utils.PostFormatter.renderPosts(posts, true);
          this.toggleLoading(false);
          this.incrementOffset();
          deferred.resolve();
        });
      }
      return deferred.promise();
    },
    renderSearchResults() {
      if (this.toJSON().loading) {
        return;
      }
      if (this.renderedResults) {
        return;
      }
      // this.toggleLoading(true);
      this.searchModel.getSearchResults(this.slug).then(matches => {
        this.incrementOffset();
        if (!this.searchModel.hasNext(this.slug) && !this.searching) {
          Tumblr.Events.trigger('fox:search:renderedResults');
          this.autopaginator.stop();
          this.renderedResults = true;
        }
        // this.toggleLoading(false);
        setTimeout(() => {
          if (this.state.get('likes')) {
            Utils.PostFormatter.renderPostsFromHtml(matches);
          } else {
            Utils.PostFormatter.renderPosts(matches);
          }
        }, 300);
      });
    },
    toggleLoading(val) {
      this.set('loading', val);
      this.loader.setLoading(this.get('loading'));
    },
    filterPosts() {
      const deferred = $.Deferred();
      if (this.state.get('dashboard') && this.autopaginator.get('defaultPaginationEnabled')) {
        this.autopaginator.disableDefaultPagination();
      }
      $('li[data-pageable]').fadeOut(300);
      $('li[data-pageable]').promise().done(() => {
        invoke(Tumblr.postsView.postViews, 'remove');
        Tumblr.postsView.postViews = [];
        $('.standalone-ad-container').remove();
        $('li[data-pageable]').remove();
        deferred.resolve();
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('PostsModel', PostsModel);
});
