module.exports = (function autopaginator() {
  Tumblr.Fox = Tumblr.Fox || {};
  const $ = Backbone.$;
  const { debounce, filter } = _;
  const { createPostView, formatDashboardPost, Posts } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;

  // NOTE: all this does is poop out posts. No component should be in charge of rendering posts except this one
  // this component should not fetch posts except upon scrolling

  let AutoPaginator = Backbone.View.extend({
    initialize(e) {
      return this.model = Tumblr.Fox.Posts,
      this.enabled = !1,
      this.defaultPagination = !0,
      this.bindEvents();
    },
    bindEvents() {
      Tumblr.Events.on('fox:apiFetch:initial', ::this.start),
      Tumblr.Events.on('fox:searchFetch:initial', ::this.start),
      Tumblr.Events.on('fox:blogFetch:initial', ::this.start);
    },
    start() {
      this.enabled = !0,
      this.defaultPagination = !1,
      Tumblr.Events.on('DOMEventor:flatscroll', ::this.onScroll),
      Tumblr.Events.on('peepr-open-request', ::this.stop),
      Tumblr.Events.on('disable-paginator', this.disableDefaultPagination),
      Tumblr.AutoPaginator.stop();
    },
    stop() {
      Tumblr.Events.off('DOMEventor:flatscroll', ::this.onScroll),
      Tumblr.Events.off('peepr-open-request', ::this.stop),
      Tumblr.Events.off('disable-paginator', this.disableDefaultPagination),
      Tunblr.Events.on('peepr:close', ::this.start),
      this.enabled = !1,
      this.defaultPagination = !0,
      Tumblr.AutoPaginator.start();
    },
    disableDefaultPagination(e) {
      // console.log('[DISABLE TUMBLR PAGINATOR]', e);
      this.defaultPagination = false,
      Tumblr.AutoPaginator.stop();
    },
    reset(opts) {
      Object.assign(this.options, opts || {});
    },
    onScroll(e) {
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        debounce(this.model.fetch, 300).call(this.model);
      }
    }
  })

  Tumblr.Fox.AutoPaginator = new AutoPaginator();

  return Tumblr.Fox;
})
