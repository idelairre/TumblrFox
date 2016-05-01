module.exports = (function postModel() {
  const $ = Backbone.$;
  const { each, defer, filter, find, isEqual, memoize } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;

  Tumblr.Fox = Tumblr.Fox || {};

  let Posts = Backbone.Model.extend({
    defaults: {
      apiSlug: {
        type: null,
        offset: 0,
        limit: 12,
        blogname: currentUser().id,
        before: null
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
      this.collection = Tumblr.Posts,
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:postFetch:finished', ::this.renderPosts);
      this.listenTo(Tumblr.Events, 'fox:filterFetch:started', ::this.updateQueryAndFetch); // update query, fetch post data
      this.listenTo(Tumblr.Events, 'fox:apiFetch:initial', ::this.initialApiFetch); // filter posts, fetch posts from api
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.setTerm);
      this.listenTo(Tumblr.Events, 'indashblog:search:complete', ::this.initialSearchFetch); // add posts to collection
      this.listenTo(Tumblr.Events, 'indashblog:search:post-added', ::this.renderPost);
      window.addEventListener('chrome:response:posts', ::this.handOffPosts);
      window.addEventListener('chrome:cachedLikes', ::this.depositPosts);
    },
    depositPosts(e) {
      Tumblr.Fox.$$cachedLikes = e.detail;
    },
    fetch() {
      const deferred = $.Deferred();
      if (this.state.apiFetch) {
        this.apiFetchPosts(this.apiSlug);
      } else if (!this.state.apiFetch && this.query.loggingData.term === '') {
        this.fetchPostData(this.query.loggingData);
      } else {
        Tumblr.Events.trigger('peepr-search:search-start', this.query);
        Tumblr.Events.trigger('indashblog:search:fetch-requested', this.query);
      }
      return deferred.resolve(this.items),
      deferred.promise();
    },
    setTerm(e) {
      this.query.loggingData.term = e.term;
    },
    updateQueryAndFetch(e) {
      if (e.blogname !== this.query.loggingData.blogname) {
       this.filterPosts(),
       Tumblr.Events.trigger('fox:blogFetch:initial');
      }
      this.query.loggingData = Object.assign({ offset: 0 }, e),
      this.fetchPostData(this.query.loggingData),
      console.log('[UPDATE QUERY]', e, this.query.loggingData);
    },
    initialApiFetch(type) {
      this.filterPosts(type),
      this.state.apiFetch = !0,
      this.state.tagSearch = !1,
      setTimeout(() => {
        this.apiFetchPosts(this.apiSlug);
      }, 300);
    },
    initialSearchFetch(posts) {
      console.log('[INITAL SEARCH FETCH]', posts);
      Tumblr.Events.trigger('fox:searchFetch:initial'),
      this.filterPosts(),
      this.state.apiFetch = !1,
      this.state.tagSearch = !0,
      setTimeout(() => {
        this.renderPosts(posts.filter(post => { return post.post_html }));
      }, 300);
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
    fuzzySearch(term) {
      this.filterPosts(),
      Tumblr.Events.trigger('fox:searchLikes:started'),
      this.collection.reset(Tumblr.Fox.$$cachedLikes),
      this.state.apiFetch = !0,
      setTimeout(() => {
        this.collection.map(post => {
          if (post.get('tags').indexOf(term) > -1) {
            console.log('[POST]', post);
            this.fetchPostData({ postId: post.id, blogNameOrId: post.attributes.blog_name });
          }
        });
        Tumblr.Events.trigger('fox:searchLikes:finished');
      }, 300);
    },
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
      console.log('[API FETCH]', slug, Tumblr.Fox.Loader.options.loading);
      window.dispatchEvent(req);
    },
    apiBlogFetchPosts(slug) {
      if (Tumblr.Fox.Loader.options.loading) {
        return;
      }
      const req = new CustomEvent('chrome:fetch:blogPosts', { detail: slug });
      window.dispatchEvent(req);
    },
    fetchPostData(slug) {
      console.log('[FETCH POST DATA] can fetch?', this.state.apiFetch && Tumblr.Fox.Loader.options.loading);
      if (!this.state.apiFetch && Tumblr.Fox.Loader.options.loading) {
        return;
      }
      Tumblr.Events.trigger('fox:postFetch:started', slug);
      let request = $.ajax({
        url: 'https://www.tumblr.com/svc/indash_blog/posts',
        beforeSend: (xhr) => {
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        data: {
          tumblelog_name_or_id: slug.blogNameOrId || slug.blogname,
          post_id: slug.postId,
          limit: slug.limit || 8,
          offset: slug.offset || 0
        }
      });
      request.success(data => { // add posts to model, notify autopager
        if (data.response.tumblelog) {
          Tumblelog.collection.add(new Tumblelog(data.response.tumblelog));
        }
        Object.assign(this.query.loggingData, slug),
        this.query.loggingData.offset += data.response.posts.length,
        Tumblr.Events.trigger('fox:postFetch:finished', data.response);
      });
      request.fail(error => {
        Tumblr.Events.trigger('fox:postFetch:failed', error);
      });
    },
    handOffPosts(e) {
      const posts = e.detail.liked_posts || e.detail.posts;
      this.apiSlug.offset += posts.length;
      console.log('[CHROME RESPONSE HANDOFF]', e.detail, this.apiSlug);
      for (let i = 0; posts.length > i; i += 1) {
        const post = posts[i];
        this.fetchPostData({
          blogNameOrId: post.blog_name,
          postId: post.id
        });
      }
    },
    renderPosts(response) {
      let posts;
      if (response.posts) {
        posts = response.posts;
      } else {
        posts = response;
      }
      for (let i = 0; posts.length > i; i += 1) {
        this.renderPost(posts[i]);
      }
    },
    renderPost(post) {
      let { postContainer, postElement, postModel } = Tumblr.Fox.formatDashboardPost(post);
      Tumblr.Fox.constants.attachNode.before(postContainer),
      Tumblr.Fox.createPostView(postElement, postModel),
      this.collection.add(postModel);
    }
  });

  Tumblr.Fox.Posts = new Posts();

  return Tumblr;
});

// fuzzyMatch(str, pattern) {
//   let cache = memoize(str => {
//     return new RegExp('^' + str.replace(/./g, x => {
//       return /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(x) ? '\\' + x + '?' : x + '?';
//     }) + '$');
//   });
//   return cache(str).test(pattern);
// },
