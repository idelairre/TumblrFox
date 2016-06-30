module.exports = (function loader(Tumblr, Backbone, _, TumblrView) {
  const { $ } = Backbone;

  const Loader = TumblrView.extend({
    id: 'Loader',
    defaults: {
      loading: false,
      error: false // TODO: expand this to handle errors
    },
    initialize() {
      this.set(this.defaults);
    },
    setLoading(loading) {
      if (loading) {
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

  Tumblr.Fox.register('LoaderComponent', Loader);

});
