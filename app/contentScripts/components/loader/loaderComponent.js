module.exports = (function loader(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { assign } = _;
  const { chromeMixin, get } = Tumblr.Fox;
  const View = get('PopoverComponent');

  const Loader = View.extend({
    defaults: {
      loading: false,
      error: false
    },
    mixins: [chromeMixin],
    initialize(e) {
      this.options = assign({}, this.defaults, e);
      this.model = Tumblr.Fox.Posts;
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(this.model, 'change:loading', ::this.setLoading);
      this.listenTo(Tumblr.Events, 'indashblog:search:started', ::this.show);
      this.listenTo(Tumblr.Events, 'indashblog:search:results-end', ::this.setLoading);
      this.chromeListenTo('chrome:search:likesByTag', ::this.show);
      this.chromeListenTo('chrome:search:likesByTerm', ::this.show);
      this.chromeListenTo('chrome:response:likesByTag', ::this.hide);
      this.chromeListenTo('chrome:response:likesByTerm', ::this.hide);
    },
    setLoading(e) {
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
});
