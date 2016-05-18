module.exports = (function postModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { isEmpty } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;
  const { chromeMixin } = Tumblr.Fox;

  // NOTE: this strikes me as a "super model", maybe thin this out?
  // TODO: redirect to dashboard if the route is other than the dashboard

  const Posts = Backbone.Model.extend({
    mixins: [chromeMixin],
    defaults: {
      apiSlug: {
        type: null,
        offset: 0,
        limit: 8,
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
        tagSearch: !0,
        dashboardSearch: !1
      }
    },
    initialize() {
      this.query = this.defaults.query;
      this.apiSlug = this.defaults.apiSlug;
      this.state = this.defaults.state;
      this.items = Tumblr.Posts;
      this.fetchedLikes = !1;
      this.loading = !1;
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:postFetch:finished', Tumblr.Fox.renderPosts);
      this.listenTo(Tumblr.Events, 'fox:filterFetch:started', ::this.initialBlogFetch); // update query, fetch post data
      this.listenTo(Tumblr.Events, 'fox:apiFetch:initial', ::this.initialApiFetch); // filter posts, fetch posts from api
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.setTerm);
      this.listenTo(Tumblr.Events, 'indashblog:search:started', ::this.toggleLoader);
      this.listenTo(Tumblr.Events, 'indashblog:search:complete', ::this.initialIndashSearch); // add posts to collection
      this.listenTo(Tumblr.Events, 'indashblog:search:post-added', Tumblr.Fox.renderPost);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.unbindEvents);
    },
    unbindEvents() {
      this.stopListening();
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.bindEvents);
    },
    fetch() {
      const deferred = $.Deferred();
      if (this.state.tagSearch && this.state.apiFetch) {
        this.renderSearchResults();
      } else if (this.state.apiFetch) {
        this.apiFetchPosts(this.apiSlug).then(::this.handOffPosts);
      } else if (!this.state.apiFetch && this.query.loggingData.term === '') {
        this.clientFetchPosts(this.query.loggingData); // NOTE: this needs to toggle the loader, it can only fetch while its not loading so it might be fucked
      } else {
        this.fetchSearchResults(this.query);
      }
      return deferred.resolve(this.items);
    },
    fetchSearchResults(query) {
      // console.log('[POST MODEL QUERY]', query);
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
         this.toggleLoader();
       }
      if (isEmpty(matches)) {
        console.log('[NO MATCHES]');
        Tumblr.Events.trigger('fox:searchLikes:finished', this.query.loggingData);
        if (Tumblr.Fox.AutoPaginator.enabled) {
           Tumblr.Events.trigger('fox:autopaginator:stop');
         }
      } else if (matches.length > 0) {
        this.handOffPosts({ posts: matches });
        this.toggleLoader();
      }
    },
    setTerm(e) {
      this.query.loggingData.term = e.term;
    },
    toggleLoader() {
      this.set('loading', this.loading = !this.loading);
    },
    initialApiFetch(type) {
      if (this.loading) {
        return;
      }
      this.filterPosts(type);
      this.state.apiFetch = !0;
      this.state.tagSearch = !1;
      this.state.dashboardSearch = !1;
      this.resetQueryOffsets();
      setTimeout(() => {
        this.apiFetchPosts(this.apiSlug).then(::this.handOffPosts);
      }, 300);
    },
    initialBlogFetch(e) {
      if (e.blogname !== this.query.loggingData.blogname) {
       this.filterPosts();
       Tumblr.Events.trigger('fox:autopaginator:start');
      }
      this.resetQueryOffsets();
      this.query.loggingData = Object.assign({ offset: 0 }, e); // this is weird and I don't want to touch it
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
        Tumblr.Fox.renderPosts(posts);
        this.toggleLoader();
      }, 300);
    },
    fetchLikesByTag(slug) {
      const deferred = $.Deferred();
      // this.toggleLoader();
      this.resetQueryOffsets();
      slug = Object.assign({
        term: slug.term,
        post_role: slug.post_role,
        post_type: slug.post_type,
        sort: slug.sort,
        filter_nsfw: slug.filter_nsfw,
        before: slug.before
      });
      const resolve = response => {
        this.$$matches = response;
        deferred.resolve(response);
        // this.toggleLoader();
      };
      this.chromeTrigger('chrome:search:likes', slug, resolve);
      return deferred.promise();
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
    searchLikes(query) {
      const deferred = $.Deferred();
      Tumblr.Events.trigger('fox:autopaginator:start');
      this.state.apiFetch = !0;
      this.state.tagSearch = !0;
      this.state.dashboardSearch = !1;
      this.fetchLikesByTag(query).then(matches => {
        this.filterPosts();
        setTimeout(() => {
          matches = matches.slice(0, 8);
          this.handOffPosts(matches);
          deferred.resolve(matches);
        }, 300);
      });
      return deferred.promise();
    },
    parseTags(postViews) {
      return postViews.map(post => {
        const tagElems = post.$el.find('.post_tags');
        if (tagElems.length > 0) {
          const rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#');
          post.tags = rawTags.filter(tag => {
            if (tag !== '') {
              return tag;
            }
          });
        } else {
          post.tags = [];
        }
      });
    },
    searchDashboard(query) {
      const deferred = $.Deferred();
      let results = [];
      if (!this.state.dashboardSearch) { // cache posts and search amongst these from now on
        this.state.dashboardSearch = !0;
        this.$$matches = Tumblr.postsView.postViews;
        this.parseTags(this.$$matches);
      }
      // console.log('[QUERY]', query, this.$$matches);
      Tumblr.Events.trigger('fox:disablePagination');
      this.state.apiFetch = !0;
      this.state.tagSearch = !0;
      this.filterPosts();
      this.toggleLoader();
      setTimeout(() => {
        results = this.$$matches.filter(post => { // TODO: make sure to filter by other query parameters
          if (post.tags.includes(query.term)) {
            return post;
          }
        });
        console.log(this.$$matches, results);
        this.handOffPosts(results);
        this.toggleLoader();
      }, 300);
      deferred.resolve(this.items);
      return deferred.promise();
    },
    apiFetchPosts(slug) {
      const deferred = $.Deferred();
      if (this.loading) {
        return deferred.reject(); // remember this shit
      }
      const resolve = response => {
        deferred.resolve(response);
        this.toggleLoader();
      };
      this.toggleLoader();
      if (this.apiSlug.type === 'likes') {
        this.chromeTrigger('chrome:fetch:likes', slug, resolve);
      } else {
        if (slug.type === 'any') {
          delete slug.type;
        }
        this.chromeTrigger('chrome:fetch:posts', slug, resolve);
      }
      return deferred.promise();
    },
    clientFetchPosts(slug) {
      // console.log('[POST MODEL STATE]', this.state, this.query);
      if (!this.state.apiFetch && this.loading) { // TODO: this really needs to change
        return;
      }
      if (this.state.tagSearch && this.query.loggingData.term === '') {
        this.toggleLoader();
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
            this.toggleLoader();
          }
          Tumblr.Events.trigger('fox:postFetch:finished', data.response);
          Object.assign(this.query.loggingData, slug);
          this.query.loggingData.offset += data.response.posts.length;
          return data;
        },
        fail: error => {
          Tumblr.Events.trigger('fox:postFetch:failed', error);
        }
      });
    },
    handOffPosts(e) {
      console.log('[RESPONSE]', e);
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
          Tumblr.Fox.renderPostFromHtml(posts[i]);
        } else {
          this.clientFetchPosts({
            blogNameOrId: post.blog_name || post.model.attributes.tumblelog || post.get('blog_name'),
            postId: post.id || post.model.get('id')
          });
        }
      }
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
