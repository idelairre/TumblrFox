module.exports = (function postModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, isEmpty } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;
  const { chromeMixin, Dashboard, Loader, State, Utils } = Tumblr.Fox;

  // NOTE: this strikes me as a "super model", maybe thin this out?
  // TODO: 1. redirect to dashboard if the route is other than the dashboard
  //       2. thin this the fuck out

  const PostsModel = Model.extend({
    id: 'Posts',
    mixins: [chromeMixin],
    defaults: {
      loading: false,
      slug: {
        type: null,
        offset: 0,
        limit: 12
      }
    },
    initialize(e) {
      this.query = assign(this.defaults.query, e.blogSearch.attributes);
      this.slug = this.defaults.slug;
      this.state = Tumblr.Fox.state;
      this.set('loading', this.defaults.loading);
      this.loader = new Tumblr.Fox.Loader({
        el: $('#auto_pagination_loader_loading')
      });
      this.blogModel = new Tumblr.Fox.Blog({
        blogSearch: e.blogSearch,
        state: this.state
      });
      this.autopaginator = new Tumblr.Fox.AutoPaginator({
        posts: this,
      });
      this.likesModel = new Tumblr.Fox.Likes();
      this.dashboardModel = new Tumblr.Fox.Dashboard();
      this.$$matches = [];
      this.bindEvents();
      return this;
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'change:loading', console.log.bind(console, '[POSTS LOADING]'));
      this.listenTo(Tumblr.Events, 'indashblog:search:complete', ::this.initialIndashSearch); // add posts to collection
      // this.listenTo(Tumblr.Events, 'fox:filterFetch:started', ::this.initialBlogFetch); // update query, fetch post data
      this.listenTo(Tumblr.Events, 'fox:apiFetch:initial', ::this.initialDashboardFetch); // filter posts, fetch posts from api
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.unbindEvents);
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.flushMatches);
      this.listenTo(Tumblr.Events, 'fox:toggleLoading', ::this.toggleLoading);
    },
    unbindEvents() {
      this.stopListening();
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.bindEvents);
    },
    initialIndashSearch(posts) {
      this.state.set('userSearch', true);
      this.toggleLoading(true);
      this.filterPosts().then(() => {
        this.blogModel.initialIndashSearch(posts).then(posts => {
          Utils.PostFormatter.renderPosts(posts);
          this.toggleLoading(false);
        });
      });
    },
    flushMatches() {
      this.$$matches = []; // not sure how this is going to work here on in
    },
    fetch() {
      console.log('[POST MODEL STATE]', this.state.get('state'));
      switch(this.state.get('state')) {
        case 'user':
          return this.fetchSearchResults();
          break;
        case 'dashboard':
          // return this.dashboardFetch(this.slug);
          break;
        case 'likes':
          return this.renderSearchResults();
          break;
      }
    },
    search(query) {
      console.log('[APP STATE]', Tumblr.Fox.state.get('state'));
      const deferred = $.Deferred();
      this.toggleLoading(true);
      this.filterPosts().then(() => {
        switch(Tumblr.Fox.state.get('state')) {
          case 'likes':
            this.likesModel.search(query).then(results => {
              this.$$matches = results;
              this.slug.offset += this.slug.limit;
              Utils.PostFormatter.renderPostsFromHtml(results.slice(0, this.slug.limit));
              this.toggleLoading(false);
              Tumblr.Events.trigger('fox:searchFinished');
              deferred.resolve();
            });
            break;
          case 'user':
            this.fetch().then(() => {
              this.toggleLoading(false);
              Tumblr.Events.trigger('fox:searchFinished');
              deferred.resolve();
            })
            break;
          case 'dashboard':
            this.dashboardModel.search(query).then(results => {
              Utils.PostFormatter.renderPostsFromHtml(results);
              Tumblr.Events.trigger('fox:searchFinished');
              this.toggleLoading(false);
              deferred.resolve();
            });
            break;
        }
      });
      return deferred.promise();
    },
    fetchSearchResults() {
      const deferred = $.Deferred();
      if (this.blogModel.blogSearch.get('next_offset') !== -1) {
        this.toggleLoading(true);
        this.blogModel.fetch();
        setTimeout(() => {
          this.toggleLoading(false);
          deferred.resolve();
        }, 300);
      }
      return deferred.promise();
    },
    resetQueryOffsets() {
      this.slug.offset = 0;
    },
    renderSearchResults() {
      if (this.get('loading')) {
        return;
      }
      const deferred = $.Deferred();
      const opts = {
        offset: this.slug.offset,
        limit: this.slug.limit
      };
      const matches = this.$$matches.slice(opts.offset, opts.offset + opts.limit);
      if (matches.length > 0) {
         this.toggleLoading(true);
       }
      if (isEmpty(matches)) {
        this.toggleLoading(false);
        deferred.resolve();
        if (this.autopaginator.enabled) {
           Tumblr.Events.trigger('fox:autopaginator:stop');
         }
      } else if (matches.length > 0) {
        setTimeout(() => {
          this.handOffPosts({
            posts: matches
          });
          deferred.resolve();
          this.toggleLoading(false);
        }, 700);
      }
      return deferred.promise();
    },
    toggleLoading(val) {
      this.set('loading', val);
      if (this.loader.get('loading') !== this.get('loading')) {
        this.loader.setLoading(this.get('loading'));
      }
    },
    initialDashboardFetch(type) {
      if (this.get('loading')) {
        return;
      }
      this.slug.type = type;
      this.state.set('dashboardSearch', true);
      this.toggleLoading(true);
      this.filterPosts().then(() => {
        this.resetQueryOffsets();
        this.dashboardModel.query(this.slug);
        setTimeout(() => {
          this.toggleLoading(false);
        }, 300);
      });
    },
    filterPosts(filterType) {
      const deferred = $.Deferred();
      if (filterType && filterType !== this.slug.type) {
        this.slug.type = filterType;
        this.resetQueryOffsets();
      }
      Tumblr.Posts.reset([]);
      Tumblr.postsView.collection.reset([]);
      $('li[data-pageable]').fadeOut(300);
      $('li[data-pageable]').promise().done(() => {
        $('.standalone-ad-container').remove();
        $('li[data-pageable]').remove();
        deferred.resolve();
      });
      return deferred.promise();
    },
    handOffPosts(e) {
      if (isEmpty(e)) {
        Tumblr.Events.trigger('fox:postFetch:empty', this.query.loggingData);
        return;
      }
      const posts = e.length ? e : e.posts || e.liked_posts || e.models || e.detail.liked_posts || e.detail.posts; // this is because of poor choices, this needs to be hammered down
      const length = posts.length;
      this.slug.offset += length;
      posts.map(post => {
        if (post.hasOwnProperty('html') && typeof post.html !== 'undefined') {
          Utils.PostFormatter.renderPostFromHtml(post);
        } else {
          this.clientFetchPosts({
            blogNameOrId: post.blog_name || post.model.attributes.tumblelog || post.get('blog_name'),
            postId: post.id || post.model.get('id')
          });
        }
      });
    }
  });

  Tumblr.Fox.Posts = PostsModel;
});

// apiFetchPosts(slug) {
//   const deferred = $.Deferred();
//   if (this.slug.type === 'likes') {
//     this.chromeTrigger('chrome:fetch:likes', slug, deferred.resolve);
//   } else {
//     if (slug.type === 'any') {
//       delete slug.type;
//     }
//     this.chromeTrigger('chrome:fetch:posts', slug, deferred.resolve);
//   }
//   return deferred.promise();
// },
// apiFetchAndRenderPosts() {
//   if (this.get('loading')) {
//     return;
//   }
//   this.toggleLoading(true);
//   this.apiFetchPosts(this.slug).then(posts => {
//     setTimeout(() => {
//       this.handOffPosts(posts);
//       this.toggleLoading(false);
//     }, 175);
//   });
// },
// initialBlogFetch(e) {
//   if (e.blogname !== this.blogModel.blogSearch.attributes.blogname) {
//    this.filterPosts();
//    Tumblr.Events.trigger('fox:autopaginator:start');
//   }
//   this.resetQueryOffsets();
//   // this.blogModel.blogSearch.set('blogname', e.blogname)
//   this.blogModel.fetch();
// },
