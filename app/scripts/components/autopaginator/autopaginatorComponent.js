module.exports = (function autopaginator() {
  Tumblr.Fox = Tumblr.Fox || {};
  const $ = Backbone.$;
  const { debounce, filter } = _;
  const { createPostView, fetchPostData, fetchPosts, filterPosts, formatDashboardPost, renderPost, renderPosts } = Tumblr.Fox;

  // NOTE: all this does is poop out posts. No component should be in charge of rendering posts except this one

  let AutoPaginator = Backbone.View.extend({
    defaults: {
      apiFetch: false,
      noTags: false,
      noTerm: true,
      hasFilter: false
    },
    query: {
      loggingData: {
        blogname: null,
        term: null,
        sort: null,
        post_type: null,
        post_role: null,
        next_offset: 0,
        offset: 0
      }
    },
    initialize(e) {
      return this.options = Object.assign({}, this.defaults, e),
      this.query = this.query,
      this.defaults = this.defaults,
      this.enabled = !1,
      this.defaultPagination = !0,
      this.bindEvents();
    },
    bindEvents() {
      Tumblr.Events.on('fox:filter:fetch', ::this.fetchPosts),
      Tumblr.Events.on('fox:filter:blogSelected', ::this.fetchPosts),
      Tumblr.Events.on('fox:postFetch:finished', ::this.renderPosts),
      window.addEventListener('chrome:response:posts', ::this.apiPrepare);
    },
    start() {
      this.enabled = !0,
      this.defaultPagination = !1,
      Tumblr.Events.on('DOMEventor:flatscroll', ::this.onScroll),
      Tumblr.Events.on('indashblog:search:complete', ::this.searchPrepare),
      Tumblr.Events.on('indashblog:search:post-added', renderPost),
      Tumblr.Events.on('peepr-open-request', ::this.stop),
      Tumblr.Events.on('disable-paginator', this.disableDefaultPagination);
      // window.addEventListener('chrome:response:posts', ::this.apiPrepare);
      filterPosts();
    },
    stop() {
      // Tumblr.Events.off('fox:filter:blogSelected', this.fetchPosts);
      Tumblr.Events.off('DOMEventor:flatscroll', ::this.onScroll),
      Tumblr.Events.off('indashblog:search:complete', ::this.searchPrepare),
      Tumblr.Events.off('indashblog:search:post-added', renderPost),
      Tumblr.Events.off('peepr-open-request', ::this.stop),
      Tumblr.Events.off('disable-paginator', this.disableDefaultPagination),
      window.removeEventListener('chrome:response:posts', ::this.apiPrepare);
      this.enabled = !1;
      this.defaultPagination = !0;
    },
    disableDefaultPagination(e) {
      // console.log('[DISABLE TUMBLR PAGINATOR]', e);
      this.defaultPagination = false,
      Tumblr.AutoPaginator.stop();
    },
    reset(opts) {
      Object.assign(this.options, opts || {});
    },
    fetchPosts(e) {
      // reset query
      if (!this.enabled) {
        this.start()
      }
      this.query.loggingData = Object.assign({ offset: 0 }, e),
      this.reset({ noTerm: true }),
      fetchPostData(this.query.loggingData);
    },
    onScroll(e) {
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        if (!this.options.apiFetch && this.options.noTerm) {
          debounce(fetchPostData, 300).call(this, this.query.loggingData);
        } else if (!this.options.apiFetch && !this.options.noTerm) {
          Tumblr.Events.trigger('peepr-search:search-start', this.query);
          Tumblr.Events.trigger('indashblog:search:fetch-requested', this.query);
        } else {
          debounce(fetchPosts, 300).call(this, Tumblr.Fox.apiSlug);
        }
      }
    },
    apiPrepare(response) {
      this.reset({ apiFetch: true, noTerm: true }),
      Tumblr.Fox.handOffPosts(response);
    },
    searchPrepare(response) {
      this.reset({ apiFetch: false, noTerm: false }),
      this.prepareDashboard(response);
    },
    prepareDashboard(response) {
      // console.log('[RESPONSE]', response);
      return filterPosts(),
      setTimeout(() => {
        const posts = filter(response, i => { return i.post_html });
        this.renderPosts(posts);
      }, 300);
    },
    renderPosts(response) {
      if (!this.enabled) {
        this.start();
      }
      renderPosts(response);
    }
  })

  Tumblr.Fox.AutoPaginator = new AutoPaginator();

  return Tumblr.Fox;
})
