module.exports = ((Tumblr, Backbone, $, _, AutoPaginatorModel, BlogModel, ControllerModel, DashboardModel, LikesModel, LoaderComponent, SearchModel, SearchResultsComponent) => {
  const { assign, each, invoke, pick } = _;
  const { get, Utils } = Tumblr.Fox;

  // NOTE: this strikes me as a "super model", maybe thin this out?
  // further, this doesn't really resemble a model, perhaps there
  // is a better way of organizing this thing??
  // TODO: 1. redirect to dashboard if the route is other than the dashboard
  //       2. thin this the fuck out

  const PostsModel = ControllerModel.extend({
    models: {
      blogModel: {
        constructor: BlogModel
      },
      dashboardModel: {
        constructor: DashboardModel,
        options: opts => {
          return {
            state: opts.state
          }
        }
      },
      likesModel: {
        constructor: LikesModel
      }
    },
    defaults: {
      loading: false,
      searching: false
    },
    initialize(options) {
      assign(this, pick(options, ['searchModel', 'state']));

      if (this.state.get('disabled')) {
        return this;
      }

      this.postViews = Tumblr.postsView;
      this.posts = this.postViews.postViews;

      this.autopaginator = new AutoPaginatorModel({
        model: this.searchModel,
        posts: this
      });
      this.loader = new LoaderComponent({
        el: $('#auto_pagination_loader_loading')
      });
      this.searchResults = new SearchResultsComponent({
        searchModel: this.searchModel,
        state: this.state
      });
      this.set(this.defaults);
      this.bindEvents();
      return this;
    },
    resetSlug() {
      this.searchModel.set('next_offset', 0);
    },
    incrementOffset(resultsLength) {
      const offset = this.searchModel.get('next_offset') + resultsLength;
      this.searchModel.set('next_offset', offset);
    },
    bindEvents() {
      this.listenTo(this.searchModel, 'change:post_type', ::this.filterPosts);
      this.listenTo(this.searchModel, 'change:filter_nsfw change:post_role', ::this.applyFilter);
      this.listenTo(Tumblr.Fox.Events, 'fox:fetch:complete', this.toggleLoading.bind(this, false));
      this.listenTo(Tumblr.AutoPaginator, 'after', ::this.filterDashboard);
    },
    unbindEvents() {
      // this.stopListening();
    },
    fetch(slug) {
      const deferred = $.Deferred();

      this._prepareRequest();
      this.toggleLoading(true);

      const fetchHelper = posts => {
        if (posts.length > 0) {
          Utils.PostFormatter.renderPosts(posts);
        }
        this.incrementOffset(posts.length);
        this.evalAndLogResults(posts);
        Tumblr.Fox.Events.trigger('fox:fetch:complete', posts); // this turns off the loader bar
        this.toggleLoading(false);
        deferred.resolve();
      };

      switch (this.state.getState()) {
        case 'user':
          this.blogModel.fetch(slug).then(response => {
            const { posts, query } = response;
            this.searchModel.set(query);
            fetchHelper(posts);
          });
          break;
        case 'dashboard':
          if (slug.term.length > 0) {
            return this.renderSearchResults(slug).then(fetchHelper);
          }
          this.dashboardModel.fetch(slug).then(response => {
            const { posts, query } = response;
            this.searchModel.set(query);
            fetchHelper(posts);
          });
          break;
        case 'likes':
          this.likesModel.search(slug).then(fetchHelper); // NOTE: this is not returning the right amount of posts
          break;
      }
      return deferred.promise();
    },
    search(query) {
      const deferred = $.Deferred();
      this._prepareRequest();

      const resultsHelper = results => {
        this.set('searching', false);
        this.toggleLoading(false);
        this.incrementOffset(results.length);
        this.evalAndLogResults(results);
        if (results.length && results.length > 0) {
          Utils.PostFormatter.renderPosts(results);
        }
        deferred.resolve();
      };

      this.resetSlug();
      this.set('searching', true);
      Tumblr.Fox.Events.trigger('fox:search:started');

      switch (this.state.getState()) {
        case 'likes':
          this.toggleLoading(true);
          this.likesModel.search(query).then(resultsHelper);
          break;
        case 'user':
          this.toggleLoading(true);
          this.blogModel.search(query).then(resultsHelper);
          break;
        case 'dashboard':
          this.loader.show(); // want to keep the loader status decouped from posts model so results can be rendered
          this.dashboardModel.search(query).then(() => {
            this.set('searching', false);
            this.loader.hide();
            deferred.resolve();
          });
        break;
      }
      return deferred.promise();
    },
    renderSearchResults(slug) {
      const deferred = $.Deferred();
      if (this.searchModel.get('renderedResults')) {
        return deferred.reject();
      }
      this.searchModel.getSearchResults(slug).then(matches => {
        if (matches.length < slug.limit && !this.get('searching')) {
          Tumblr.Fox.Events.trigger('fox:search:renderedResults', {
            loggingData: slug
          });
          this.autopaginator.stop();
          this.searchModel.set('renderedResults', true);
        }
        setTimeout(() => {
          deferred.resolve(matches);
        }, 500);
      });
      return deferred.promise();
    },
    evalAndLogResults(results) {
      if (results.length < this.searchModel.get('limit')) {
        this.searchModel.set('renderedResults', true);
        Tumblr.Fox.Events.trigger('fox:search:renderedResults', {
          loggingData: this.searchModel.toJSON()
        });
        this.autopaginator.stop();
      }
    },
    toggleLoading(val) {
      this.set('loading', val);
      this.loader.setLoading(this.get('loading'));
    },
    _prepareRequest() {
      if (!this.autopaginator.get('enabled')) {
        this.autopaginator.start();
      }
      if (this.autopaginator.get('defaultPaginationEnabled')) {
        this.autopaginator.disableDefaultPagination();
      }
      this.searchModel.set('renderedResults', false);
    },
    filterDashboard() {
      this.postViews.$el.find('.standalone-ad-container').remove();
      if (this.searchModel.get('filter_nsfw')) {
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
    filterPosts() {
      const deferred = $.Deferred();
      if (this.autopaginator.get('enableDefaultPagination')) {
        this.autopaginator.disableDefaultPagination();
      }
      $('li[data-pageable]').fadeOut(300).promise().then(() => {
        invoke(this.posts, 'remove');
        this.postViews.collection.reset();
        this.posts = [];
        $('li[data-pageable]').remove();
        $('.standalone-ad-container').remove();
        deferred.resolve();
      });
      return deferred.promise();
    },
    applyFilter() {
      if (this.searchModel.get('filter_nsfw')) {
        this.postViews.collection.whereBy({ 'tumblelog-content-rating': 'nsfw' }).invoke('dismiss');
        this.postViews.collection.whereBy({ 'tumblelog-content-rating': 'adult' }).invoke('dismiss');
      }
      if (this.searchModel.get('post_role') === 'ORIGINAL') {
        this.postViews.collection.whereBy({ is_reblog: true }).invoke('dismiss');
      }
    },
  });

  Tumblr.Fox.register('PostsModel', PostsModel);

});
