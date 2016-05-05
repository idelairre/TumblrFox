module.exports = (function loader() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  // TODO: turn this into a backbone view so it can listen to post model changes rather than have a huge number of listeners

  let Loader = Backbone.View.extend({
    defaults: {
      loading: false,
      error: false
    },
    initialize(e) {
      this.options = Object.assign({}, this.defaults, e),
      this.model = Tumblr.Fox.Posts,
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(this.model, 'change:loading', ::this.setLoading);
    },
    setLoading(e) {
      console.log('[LOADING?]', e.loading);
      if (e.loading) {
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
})
