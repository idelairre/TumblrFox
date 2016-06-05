module.exports = (function autopaginator(Tumblr, Backbone, _) {
  const { debounce } = _;
  const { Posts } = Tumblr.Fox;

  // NOTE: all this does is poop out posts. No component should be in charge of rendering posts except this one
  // this component should not fetch posts except upon scrolling

  const AutoPaginator = Backbone.View.extend({
    model: Posts,
    initialize() {
      this.enabled = false;
      this.defaultPagination = true;
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:autopaginator:start', ::this.start);
      this.listenTo(Tumblr.Events, 'fox:autopaginator:stop', ::this.stop);
      this.listenTo(Tumblr.Events, 'fox:disablePagination', ::this.disableAll);
      this.listenTo(Tumblr.Events, 'indashblog:search:results-end', ::this.stop);
    },
    start() {
      console.log('[AUTOPAGINATOR] started');
      this.enabled = true;
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.stop);
      this.disableDefaultPagination();
    },
    stop() {
      console.log('[AUTOPAGINATOR] stopped');
      this.enabled = false;
      this.stopListening(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      Tumblr.Events.on('peepr:close', ::this.start);
    },
    disableAll() {
      console.log('[AUTOPAGINATOR] all pagination disabled');
      this.enabled = false;
      this.defaultPagination = false;
      Tumblr.AutoPaginator.stop();
      this.stop();
    },
    enableDefaultPagination() {
      this.enabled = false;
      this.defaultPagination = true;
      Tumblr.AutoPaginator.start();
    },
    disableDefaultPagination() {
      this.enabled = true;
      this.defaultPagination = false;
      Tumblr.AutoPaginator.stop();
    },
    onScroll(e) {
      if (!this.enabled) {
        return;
      }
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        debounce(::this.model.fetch, 300)();
      }
    }
  });

  Tumblr.Fox.AutoPaginator = new AutoPaginator();
});
