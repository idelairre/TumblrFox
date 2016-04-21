module.exports = (function autopaginator() {
  const $ = Backbone.$;
  const { debounce } = _;

  Tumblr.Fox = Tumblr.Fox || {};

  const { createPostView, fetchPostData, fetchPosts, filterPosts, formatDashboardPost, renderPosts } = Tumblr.Fox;

  let AutoPaginator = Backbone.View.extend({
    defaults: {
      apiFetch: false,
      noTags: false,
      noTerm: true,
      query: {
        loggingData: {
          blogname: null,
          term: null,
          sort: null,
          post_type: null,
          post_role: null,
          next_offset: null,
          offset: null
        }
      }
    },
    initialize(e) {
      return this.options = Object.assign({}, this.defaults, e),
      this.query = this.options.query,
      this.defaults = this.defaults,
      this.enabled = !1,
      this.defaultPagination = !0;
    },
    start() {
      this.enabled = true;
      this.defaultPagination = false;
      Tumblr.Events.on('DOMEventor:flatscroll', ::this.fetchPosts);
      Tumblr.Events.on('indashblog:search:post-added', ::this.renderPost);
      Tumblr.Events.on('peepr-open-request', ::this.stop);
      Tumblr.Events.on('disable-paginator', this.disableDefaultPagination)
      filterPosts();
    },
    stop() {
      Tumblr.Events.off('DOMEventor:flatscroll', ::this.fetchPosts);
      Tumblr.Events.off('indashblog:search:post-added', ::this.renderPost);
      Tumblr.Events.off('peepr-open-request', ::this.stop);
      Tumblr.Events.off('disable-paginator', this.disableDefaultPagination);
      this.enabled = false;
      this.defaultPagination = true;
    },
    disableDefaultPagination(e) {
      console.log('[DISABLE TUMBLR PAGINATOR]', e);
      this.defaultPagination = false;
      Tumblr.AutoPaginator.stop();
    },
    reset(opts) {
      filterPosts(),
      Object.assign(this.options, opts || {});
    },
    fetchPosts(e) {
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        if (!this.options.apiFetch) {
          // if (this.options.noTags || this.options.noTerm) {
          //   // console.log('[AUTOPAGINATOR BLOG FETCH QUERY]', this.query);
          //   debounce(fetchPostData, 300).call(this, this.query.loggingData, renderPosts);
          //   return;
          // }
          console.log('[AUTOPAGINATOR QUERY]', this.query);
          Tumblr.Events.trigger('peepr-search:search-start', this.query);
          Tumblr.Events.trigger('indashblog:search:fetch-requested', this.query);
        } else {
          debounce(fetchPosts, 300).call(this, Tumblr.Fox.options);
        }
      }
    },
    assignQuery(e) {
      console.log('[BLOG FETCH RESPONSE]', e);
    },
    renderPost(post) {
      let { postContainer, postElement, postModel } = formatDashboardPost(post);
      Tumblr.Fox.constants.attachNode.before(postContainer);
      createPostView(postElement, postModel);
    }
  })

  Tumblr.Fox.AutoPaginator = new AutoPaginator();

  return Tumblr.Fox;
})
