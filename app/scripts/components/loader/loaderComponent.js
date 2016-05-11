module.exports = (function loader() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;

  const Loader = Backbone.View.extend({
    defaults: {
      loading: false,
      error: false
    },
    initialize(e) {
      this.options = Object.assign({}, this.defaults, e);
      this.model = Tumblr.Fox.Posts;
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(this.model, 'change:loading', ::this.setLoading);
      this.listenTo(Tumblr.Events, 'indashblog:search:results-end', ::this.setLoading);
    },
    setLoading(e) {
      // console.log('[LOADING?]', e);
      // this.loading = !!e.loading;
      if (e && e.loading) {
        this.show();
      } else {
        setTimeout(::this.hide, 300);
      }
    },
    show() {
      this.$el.show();
    },
    hide() {
      this.$el.hide();
    }
  });

  Tumblr.Fox.Loader = new Loader({
    el: $('#auto_pagination_loader_loading')
  });

  return Tumblr.Fox.Loader;
});
