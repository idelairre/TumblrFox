module.exports = (function autopaginator(Tumblr, Backbone, _) {
  const { debounce } = _;
  const { Model } = Backbone;

  // NOTE: all this does is poop out posts. No component should be in charge of rendering posts except this one
  // this component should not fetch posts except upon scrolling

  const AutoPaginator = Model.extend({
    id: 'Autopaginator',
    defaults: {
      enabled: false,
      defaultPagination: true
    },
    initialize(e) {
      this.attributes = {};
      this.set(this.defaults);
      this.posts = e.posts;
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
      this.set('enabled', true);
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.stop);
      this.disableDefaultPagination();
    },
    stop() {
      console.log('[AUTOPAGINATOR] stopped');
      this.set('enabled', false);
      this.stopListening(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      Tumblr.Events.on('peepr:close', ::this.start);
    },
    disableAll() {
      console.log('[AUTOPAGINATOR] all pagination disabled');
      this.set('enabled', false);
      this.set('defaultPagination', false);
      Tumblr.AutoPaginator.stop();
      this.stop();
    },
    enableDefaultPagination() {
      this.set('enabled', false);
      this.set('defaultPagination', true);
      Tumblr.AutoPaginator.start();
    },
    disableDefaultPagination() {
      this.set('enabled', true);
      this.set('defaultPagination', false);
      Tumblr.AutoPaginator.stop();
    },
    onScroll(e) {
      if (!this.get('enabled')) {
        return;
      }
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        debounce(::this.posts.fetch, 300)();
      }
    }
  });

  Tumblr.Fox.AutoPaginator = AutoPaginator;
});
