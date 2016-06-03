module.exports = (function postModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { assign, isEmpty } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;
  const { chromeMixin, Utils } = Tumblr.Fox;

  // NOTE: this strikes me as a "super model", maybe thin this out?
  // TODO: 1. redirect to dashboard if the route is other than the dashboard
  //       2. thin this the fuck out

  const PostsModel = Backbone.Model.extend({
    mixins: [chromeMixin],
    defaults: {
      apiSlug: {
        type: null,
        offset: 0,
        limit: 12,
        blogname: currentUser().id
      },
      query: {
        loggingData: {
          blogname: null,
          term: '',
          sort: null,
          post_type: 'ANY',
          post_role: 'ANY',
          next_offset: 0,
          offset: 0
        }
      },
      state: { // this is confusing and has to change
        apiFetch: !1,
        tagSearch: !0,
        dashboardSearch: !1
      }
    },
    initialize() {
      this.query = this.defaults.query;
      this.apiSlug = this.defaults.apiSlug;
      this.state = this.defaults.state;
      this.items = Tumblr.Posts;
      this.loading = !1;
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:postFetch:finished', Utils.PostFormatter.renderPosts);
      this.listenTo(Tumblr.Events, 'fox:filterFetch:started', ::this.initialBlogFetch); // update query, fetch post data
      this.listenTo(Tumblr.Events, 'fox:apiFetch:initial', ::this.initialApiFetch); // filter posts, fetch posts from api
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.setTerm);
      this.listenTo(Tumblr.Events, 'indashblog:search:complete', ::this.initialIndashSearch); // add posts to collection
      this.listenTo(Tumblr.Events, 'indashblog:search:post-added', Utils.PostFormatter.renderPost);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.unbindEvents);
    },
    unbindEvents() {
      this.stopListening();
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.bindEvents);
    },
    fetch() {
      if (this.state.tagSearch && this.state.apiFetch) {
        this.renderSearchResults();
      } else if (this.state.apiFetch) {
        this.apiFetchAndRenderPosts();
      } else if (!this.state.apiFetch && this.query.loggingData.term === '') {
        this.clientFetchPosts(this.query.loggingData); // NOTE: this needs to toggle the loader, it can only fetch while its not loading so it might be fucked
      } else {
        this.fetchSearchResults(this.query);
      }
    },
    fetchSearchResults(query) {
      Tumblr.Events.trigger('peepr-search:search-start', query);
      Tumblr.Events.trigger('indashblog:search:fetch-requested', query);
    },
    resetQueryOffsets() {
      this.apiSlug.offset = 0;
      this.query.loggingData.offset = 0;
      this.query.loggingData.next_offset = 0;
    },
    renderSearchResults() {
      if (this.loading) {
        return;
      }
      const opts = {
        offset: this.apiSlug.offset,
        limit: this.apiSlug.limit
      };
      const matches = this.$$matches.slice(opts.offset, opts.offset + opts.limit);
      console.log('[MATCHES]', matches);
      if (matches.length > 0) {
         this.toggleLoading();
       }
      if (isEmpty(matches)) {
        console.log('[NO MATCHES]');
        Tumblr.Events.trigger('fox:search:finished', this.query.loggingData);
        if (Tumblr.Fox.AutoPaginator.enabled) {
           Tumblr.Events.trigger('fox:autopaginator:stop');
         }
      } else if (matches.length > 0) {
        this.handOffPosts({
          posts: matches
        });
        this.toggleLoading();
      }
    },
    setTerm(e) {
      this.query.loggingData.term = e.term;
    },
    toggleLoading() {
      this.set('loading', this.loading = !this.loading);
    },
    initialApiFetch(type) {
      if (this.loading) {
        return;
      }
      this.filterPosts(type);
      this.toggleLoading();
      this.state.apiFetch = !0;
      this.state.tagSearch = !1;
      this.state.dashboardSearch = !1;
      this.resetQueryOffsets();
      setTimeout(() => {
        this.apiFetchPosts(this.apiSlug).then(posts => {
          this.handOffPosts(posts);
          this.toggleLoading();
        }, 300);
      })
    },
    apiFetchPosts(slug) {
      console.log('[FETCH API POSTS]');
      const deferred = $.Deferred();
      if (this.apiSlug.type === 'likes') {
        this.chromeTrigger('chrome:fetch:likes', slug, deferred.resolve);
      } else {
        if (slug.type === 'any') {
          delete slug.type;
        }
        this.chromeTrigger('chrome:fetch:posts', slug, deferred.resolve);
      }
      return deferred.promise();
    },
    apiFetchAndRenderPosts() {
      if (this.loading) {
        return;
      }
      this.toggleLoading();
      this.apiFetchPosts(this.apiSlug).then(posts => {
        setTimeout(() => {
          this.handOffPosts(posts);
          this.toggleLoading();
        }, 175);
      });
    },
    initialBlogFetch(e) {
      if (e.blogname !== this.query.loggingData.blogname) {
       this.filterPosts();
       Tumblr.Events.trigger('fox:autopaginator:start');
      }
      this.resetQueryOffsets();
      this.query.loggingData = assign({ offset: 0 }, e); // this is weird and I don't want to touch it
      this.clientFetchPosts(this.query.loggingData);
    },
    initialIndashSearch(posts) {
      Tumblr.Events.trigger('fox:autopaginator:start');
      this.filterPosts();
      this.state.apiFetch = !1;
      this.state.tagSearch = !0;
      this.state.dashboardSearch = !1;
      setTimeout(() => {
        posts = posts.filter(post => {
          return post.post_html;
        });
        Utils.PostFormatter.renderPosts(posts);
        this.toggleLoading();
      }, 300);
    },
    filterPosts(filterType) {
      if (filterType && filterType !== this.apiSlug.type) {
        this.apiSlug.type = filterType;
        this.resetQueryOffsets();
      }
      Tumblr.Posts.reset([]);
      Tumblr.postsView.collection.reset([]);
      Tumblr.postsView.postViews = [];
      $('li[data-pageable]').fadeOut(300, () => {
        $('.standalone-ad-container').remove();
        $('li[data-pageable]').remove();
      });
    },
    searchDashboard(query) {
      const deferred = $.Deferred();
      let results = [];
      if (!this.state.dashboardSearch) { // cache posts and search amongst these from now on
        this.state.dashboardSearch = !0;
        this.$$matches = Tumblr.postsView.postViews;
        Utils.postFormatter.parseTags(this.$$matches);
      }
      // console.log('[QUERY]', query, this.$$matches);
      Tumblr.Events.trigger('fox:disablePagination');
      this.state.apiFetch = !0;
      this.state.tagSearch = !0;
      this.filterPosts();
      this.toggleLoading();
      setTimeout(() => {
        results = this.$$matches.filter(post => { // TODO: make sure to filter by other query parameters
          if (post.tags.includes(query.term)) {
            return post;
          }
        });
        console.log(this.$$matches, results);
        this.handOffPosts(results);
        this.toggleLoading();
      }, 300);
      deferred.resolve(this.items);
      return deferred.promise();
    },
    clientFetchPosts(slug) {
      if (!this.state.apiFetch && this.loading) { // TODO: this really needs to change
        return;
      }
      if (this.state.tagSearch && this.query.loggingData.term === '') {
        this.toggleLoading();
      }
      $.ajax({
        url: 'https://www.tumblr.com/svc/indash_blog/posts',
        beforeSend: xhr => {
          Tumblr.Events.trigger('fox:postFetch:started', slug);
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        data: {
          tumblelog_name_or_id: slug.blogNameOrId || slug.blogname,
          post_id: slug.postId,
          limit: slug.limit || 8,
          offset: slug.offset || 0
        },
        success: data => {
          if (data.response.tumblelog) {
            Tumblelog.collection.add(new Tumblelog(data.response.tumblelog));
          }
          if (this.state.tagSearch && this.query.loggingData.term === '') {
            this.toggleLoading();
          }
          Tumblr.Events.trigger('fox:postFetch:finished', data.response);
          assign(this.query.loggingData, slug);
          this.query.loggingData.offset += data.response.posts.length;
          return data;
        },
        fail: error => {
          Tumblr.Events.trigger('fox:postFetch:failed', error);
        }
      });
    },
    handOffPosts(e) {
      if (isEmpty(e)) {
        Tumblr.Events.trigger('fox:postFetch:empty', this.query.loggingData);
        return;
      }
      const posts = e.length ? e : e.posts || e.liked_posts || e.models || e.detail.liked_posts || e.detail.posts; // this is because of poor choices, this needs to be hammered down
      const length = posts.length;
      this.apiSlug.offset += length;
      for (let i = 0; length > i; i += 1) {
        const post = posts[i];
        if (post.hasOwnProperty('html') && $.parseHTML(post.html)) {
          Utils.PostFormatter.renderPostFromHtml(posts[i]);
        } else {
          this.clientFetchPosts({
            blogNameOrId: post.blog_name || post.model.attributes.tumblelog || post.get('blog_name'),
            postId: post.id || post.model.get('id')
          });
        }
      }
    }
  });

  Tumblr.Fox.Posts = new PostsModel();
});
