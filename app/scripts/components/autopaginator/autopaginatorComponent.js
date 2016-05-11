module.exports = (function autopaginator() {
  Tumblr.Fox = Tumblr.Fox || {};
  const $ = Backbone.$;
  const { debounce, filter, once } = _;
  const { createPostView, formatDashboardPost, Posts } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;

  // NOTE: all this does is poop out posts. No component should be in charge of rendering posts except this one
  // this component should not fetch posts except upon scrolling

  let AutoPaginator = Backbone.View.extend({
    model: Posts,
    initialize(e) {
      this.enabled = !1,
      this.defaultPagination = !0,
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:autopaginator:start', ::this.start);
      this.listenTo(Tumblr.Events,'fox:autopaginator:stop', ::this.stop);
      this.listenTo(Tumblr.Events, 'fox:disablePagination', ::this.disableAll);
      this.listenTo(Tumblr.Events, 'indashblog:search:results-end', ::this.stop);
    },
    start() {
      console.log('[AUTOPAGINATOR] started');
      this.enabled = !0;
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.stop);
      this.disableDefaultPagination();
    },
    stop() {
      console.log('[AUTOPAGINATOR] stopped');
      this.enabled = !1;
      this.stopListening(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      Tumblr.Events.on('peepr:close', ::this.start);
    },
    disableAll() {
      console.log('[AUTOPAGINATOR] all pagination disabled');
      this.enabled = !1;
      this.defaultPagination = !1;
      Tumblr.AutoPaginator.stop();
      this.stop();
    },
    enableDefaultPagination() {
      this.enabled = !1;
      this.defaultPagination = !0;
      Tumblr.AutoPaginator.start();
    },
    disableDefaultPagination() {
      this.enabled = !0;
      this.defaultPagination = !1;
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

  return Tumblr.Fox.AutoPaginator;
})
