module.exports = (function postModel() {
  const $ = Backbone.$;
  const { each, defer, memoize } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;

  Tumblr.Fox = Tumblr.Fox || {};

  let Posts = Backbone.Model.extend({
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
      state: {
        apiFetch: !1,
        tagSearch: !0
      }
    },
    initialize(e) {
      this.query = this.defaults.query,
      this.apiSlug = this.defaults.apiSlug,
      this.state = this.defaults.state,
      this.items = Tumblr.Posts,
      this.fetchedLikes = !1,
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:postFetch:finished', ::this.renderPosts);
      this.listenTo(Tumblr.Events, 'fox:filterFetch:started', ::this.initialBlogFetch); // update query, fetch post data
      this.listenTo(Tumblr.Events, 'fox:apiFetch:initial', ::this.initialApiFetch); // filter posts, fetch posts from api
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.setTerm);
      this.listenTo(Tumblr.Events, 'indashblog:search:complete', ::this.initialIndashSearch); // add posts to collection
      this.listenTo(Tumblr.Events, 'indashblog:search:post-added', ::this.renderPost);
      window.addEventListener('chrome:response:posts', ::this.handOffPosts);
    },
    fetch() {
      const deferred = $.Deferred();
      if (this.state.tagSearch && this.state.apiFetch) {
        this.renderSearchResults();
      } else if (this.state.apiFetch) {
        this.apiFetchPosts(this.apiSlug);
      } else if (!this.state.apiFetch && this.query.loggingData.term === '') {
        this.clientFetchPosts(this.query.loggingData);
      } else {
        Tumblr.Events.trigger('peepr-search:search-start', this.query);
        Tumblr.Events.trigger('indashblog:search:fetch-requested', this.query);
      }
      return deferred.resolve(this.items);
    },
    renderSearchResults() {
      if (Tumblr.Fox.Loader.options.loading) {
        return;
      }
      const opts = {
        offset: this.apiSlug.offset,
        limit: this.apiSlug.limit
      }
      const matches = this.$$matches.slice(opts.offset, opts.offset + opts.limit);
      if (matches.length > 0) {
        this.handOffPosts({ posts: matches });
      } else {
        if (Tumblr.Fox.AutoPaginator.enabled) {
          Tumblr.Events.trigger('fox:searchLikes:finished');
        }
      }
    },
    setTerm(e) {
      this.query.loggingData.term = e.term;
    },
    initialApiFetch(type) {
      this.filterPosts(type),
      this.state.apiFetch = !0,
      this.state.tagSearch = !1,
      setTimeout(() => {
        this.apiFetchPosts(this.apiSlug);
      }, 300);
    },
    initialBlogFetch(e) {
      if (e.blogname !== this.query.loggingData.blogname) {
       this.filterPosts(),
       Tumblr.Events.trigger('fox:blogFetch:initial');
      }
      this.query.loggingData = Object.assign({ offset: 0 }, e),
      this.clientFetchPosts(this.query.loggingData);
    },
    initialIndashSearch(posts) {
      Tumblr.Events.trigger('fox:searchFetch:initial'),
      this.filterPosts(),
      this.state.apiFetch = !1,
      this.state.tagSearch = !0,
      setTimeout(() => {
        this.renderPosts(posts.filter(post => { return post.post_html }));
      }, 300);
    },
    fetchLikesByTag(slug) {
      console.log('[FETCH LIKES BY TAG]', slug);
      const deferred = $.Deferred();
      slug = Object.assign({
        term: slug.term,
        post_role: slug.post_role,
        post_type: slug.post_type,
        sort: slug.sort,
        filter_nsfw: slug.filter_nsfw
      });
      const req = new CustomEvent('chrome:search:likes', { detail: slug });
      console.log(req);
      const resolve = e => {
        this.$$matches = e.detail;
        deferred.resolve(e.detail);
        window.removeEventListener('chrome:response:likes', resolve);
      }
      window.dispatchEvent(req);
      window.addEventListener('chrome:response:likes', resolve);
      return deferred.promise();
    },
    filterPosts(filterType) {
      if (filterType && filterType !== this.apiSlug.type) {
        this.apiSlug.type = filterType;
        this.apiSlug.offset = 0;
      }
      Tumblr.Posts.reset([]),
      Tumblr.postsView.collection.reset([]),
      Tumblr.postsView.postViews = [],
      $('li[data-pageable]').fadeOut(300, () => {
        $('.standalone-ad-container').remove(),
        $('li[data-pageable]').remove();
      });
    },
    searchLikes(query) {
      const deferred = $.Deferred();
      this.filterPosts(),
      Tumblr.Events.trigger('fox:searchLikes:started'),
      this.state.apiFetch = !0,
      this.state.tagSearch = !0,
      this.fetchLikesByTag(query).then(matches => {
        matches = matches.slice(0, 8);
        this.handOffPosts({ posts: matches });
        Tumblr.Events.trigger('fox:searchLikes:finished');
        deferred.resolve(matches);
      });
      return deferred.promise();
    },
    // TODO: put this in a promise pattern
    apiFetchPosts(slug) {
      if (Tumblr.Fox.Loader.options.loading) {
        return;
      }
      let req;
      if (this.apiSlug.type === 'likes') {
        req = new CustomEvent('chrome:fetch:likes', { detail: slug });
      } else {
        req = new CustomEvent('chrome:fetch:posts', { detail: slug });
      }
      console.log('[API FETCH]', slug);
      window.dispatchEvent(req);
    },
    clientFetchPosts(slug) {
      if (!this.state.apiFetch && Tumblr.Fox.Loader.options.loading) {
        return;
      }
      $.ajax({
        url: 'https://www.tumblr.com/svc/indash_blog/posts',
        beforeSend: (xhr) => {
          Tumblr.Events.trigger('fox:postFetch:started', slug);
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        data: {
          tumblelog_name_or_id: slug.blogNameOrId || slug.blogname,
          post_id: slug.postId,
          limit: slug.limit || 8,
          offset: slug.offset || 0
        },
        success: (data) => { // add posts to model, notify autopager
          if (data.response.tumblelog) {
            Tumblelog.collection.add(new Tumblelog(data.response.tumblelog));
          }
          Tumblr.Events.trigger('fox:postFetch:finished', data.response);
          Object.assign(this.query.loggingData, slug),
          this.query.loggingData.offset += data.response.posts.length;
        },
        fail: (error) => {
          Tumblr.Events.trigger('fox:postFetch:failed', error);
        }
      });
    },
    handOffPosts(e) {
      const posts = e.posts || e.detail.liked_posts || e.detail.posts || e.models;
      this.apiSlug.offset += posts.length;
      let length = posts.length;
      for (let i = 0; length > i; i += 1) {
        const post = posts[i];
        this.clientFetchPosts({
          blogNameOrId: post.blog_name || post.get('blog_name'),
          postId: post.id
        });
      }
    },
    renderPosts(response) {
      let posts = response.posts || response;
      for (let i = 0; posts.length > i; i += 1) { // NOTE: posts do not come out in order due to different formatting times
        this.renderPost(posts[i]);
      }
    },
    renderPost(post) {
      let { postContainer, postElement, postModel } = Tumblr.Fox.formatDashboardPost(post);
      Tumblr.Fox.constants.attachNode.before(postContainer),
      Tumblr.Fox.createPostView(postElement, postModel),
      this.items.add(postModel);
    }
  });

  Tumblr.Fox.Posts = new Posts();

  return Tumblr.Fox.Posts;
});

// apiBlogFetchPosts(slug) {
//   if (Tumblr.Fox.Loader.options.loading) {
//     return;
//   }
//   const req = new CustomEvent('chrome:fetch:blogPosts', { detail: slug });
//   window.dispatchEvent(req);
// },
