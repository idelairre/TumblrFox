module.exports = (function autopaginator(Tumblr, Backbone, _) {
  const { debounce } = _;
  const { Model } = Backbone;

  // NOTE: all this does is poop out posts. No component should be in charge of rendering posts except this one
  // this component should not fetch posts except upon scrolling

  const AutoPaginator = Model.extend({
    id: 'Autopaginator',
    defaults: {
      enabled: false,
      defaultPaginationEnabled: true
    },
    initialize(options) {
      this.posts = options.posts;
      this.attributes = {};
      this.set(this.defaults);
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:autopaginator:start', ::this.start);
      this.listenTo(Tumblr.Events, 'fox:autopaginator:stop', ::this.stop);
      this.listenTo(Tumblr.Events, 'fox:disablePagination', ::this.disableAll);
    },
    start() {
      if (this.get('enabled')) {
        console.info('[FOX AUTOPAGINATOR]: pagination already enabled');
        return;
      }
      this.set('enabled', true);
      this.listenTo(Tumblr.Events, 'indashblog:search:results-end', ::this.stop);
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.stop);
      this.stopListening(Tumblr.Events, 'peepr:close', ::this.onScroll);
      this.disableDefaultPagination();
      console.log('[FOX AUTOPAGINATOR]: started');
    },
    stop() {
      if (!this.get('enabled')) {
        console.info('[FOX AUTOPAGINATOR]: pagination already disabled');
        return;
      }
      this.set('enabled', false);
      this.stopListening(Tumblr.Events, 'indashblog:search:results-end', ::this.stop);
      this.stopListening(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      this.stopListening(Tumblr.Events, 'peepr-open-request', ::this.stop);
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.start);
      console.log('[FOX AUTOPAGINATOR]: stopped');
    },
    disableAll() {
      this.stop();
      this.disableDefaultPagination();
    },
    enableDefaultPagination() {
      if (this.get('enabled')) {
        this.stop();
      }
      if (!this.get('defaultPaginationEnabled')) {
        this.set('defaultPaginationEnabled', true);
        Tumblr.AutoPaginator.start();
      }
    },
    disableDefaultPagination() {
      if (!this.get('defaultPaginationEnabled')) {
        console.info('[TUMBLR AUTOPAGINATOR]: Default pagination already disabled');
        return;
      }
      this.set('defaultPaginationEnabled', false);
      Tumblr.AutoPaginator.stop();
      console.log('[TUMBLR AUTOPAGINATOR]: stopped');
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

  Tumblr.Fox.register('AutoPaginatorModel', AutoPaginator);
});
