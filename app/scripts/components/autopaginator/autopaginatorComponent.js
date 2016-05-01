module.exports = (function autopaginator() {
  Tumblr.Fox = Tumblr.Fox || {};
  const $ = Backbone.$;
  const { debounce, filter, once } = _;
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
      Tumblr.Events.on('fox:apiFetch:initial', ::this.start);
      Tumblr.Events.on('fox:blogFetch:initial', ::this.start);
      Tumblr.Events.on('fox:searchFetch:initial', ::this.start);
      Tumblr.Events.on('fox:searchLikes:started', ::this.disableAll);
    },
    start() {
      console.log('[AUTOPAGINATOR] started');
      Tumblr.Events.on('DOMEventor:flatscroll', ::this.onScroll);
      Tumblr.Events.on('peepr-open-request', ::this.stop);
      Tumblr.Events.on('disable-paginator', this.disableDefaultPagination);
      this.disableDefaultPagination();
    },
    stop() {
      console.log('[AUTOPAGINATOR] stopped');
      Tumblr.Events.off('DOMEventor:flatscroll', ::this.onScroll);
      Tumblr.Events.off('peepr-open-request', ::this.stop);
      Tumblr.Events.off('disable-paginator', this.disableDefaultPagination);
      Tumblr.Events.on('peepr:close', ::this.start);
    },
    disableAll() {
      console.log('[AUTOPAGINATOR] all pagination disabled');
      this.enabled = !1,
      this.defaultPagination = !1,
      Tumblr.AutoPaginator.stop(),
      this.stop();
    },
    enableDefaultPagination() {
      this.enabled = !1,
      this.defaultPagination = !0,
      Tumblr.AutoPaginator.start();
    },
    disableDefaultPagination() {
      this.enabled = !0,
      this.defaultPagination = !1,
      Tumblr.AutoPaginator.stop();
    },
    onScroll(e) {
      if (!this.enabled) {
        return;
      }
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        debounce.bind(once(this.model.fetch).call(this.model), 300); // fucking lodash
      }
    }
  })

  Tumblr.Fox.AutoPaginator = new AutoPaginator();

  return Tumblr;
})
