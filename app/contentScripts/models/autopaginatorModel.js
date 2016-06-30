module.exports = (function(Tumblr, Backbone, _) {
  const { Model } = Backbone;
  const { assign, pick } = _;

  const AutoPaginator = Model.extend({
    defaults: {
      enabled: false,
      defaultPaginationEnabled: true
    },
    initialize(options) {
      assign(this, pick(options, ['model', 'posts']));
      this.attributes = {};
      this.set(this.defaults);
    },
    start() {
      if (this.get('enabled')) {
        if (Tumblr.Fox.options.get('logging')) {
          console.info('[FOX AUTOPAGINATOR]: pagination already enabled');
        }
        return;
      }
      this.set('enabled', true);
      this.listenTo(Tumblr.Events, 'indashblog:search:results-end', ::this.stop);
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.stop);
      this.stopListening(Tumblr.Events, 'peepr:close', ::this.onScroll);
      this.disableDefaultPagination();
      if (Tumblr.Fox.options.get('logging')) {
        console.log('[FOX AUTOPAGINATOR]: started');
      }
    },
    stop() {
      if (!this.get('enabled')) {
        if (Tumblr.Fox.options.get('logging')) {
          console.info('[FOX AUTOPAGINATOR]: pagination already disabled');
        }
        return;
      }
      this.set('enabled', false);
      this.stopListening(Tumblr.Events, 'indashblog:search:results-end', ::this.stop);
      this.stopListening(Tumblr.Events, 'DOMEventor:flatscroll', ::this.onScroll);
      this.stopListening(Tumblr.Events, 'peepr-open-request', ::this.stop);
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.start);
      if (Tumblr.Fox.options.get('logging')) {
        console.log('[FOX AUTOPAGINATOR]: stopped');
      }
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
      this.set('defaultPaginationEnabled', false);
      Tumblr.AutoPaginator.stop();
      console.log('[TUMBLR AUTOPAGINATOR]: stopped');
    },
    onScroll(e) {
      if (!this.get('enabled')) {
        return;
      }
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        if (this.posts.get('loading')) {
          return;
        }
        this.posts.fetch(this.model.toJSON()).then(() => {
          this.trigger('after');
        });
      }
    }
  });

  Tumblr.Fox.register('AutoPaginatorModel', AutoPaginator);

});
