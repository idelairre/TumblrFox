module.exports = (function loaderMixin(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { get } = Tumblr.Fox;
  const Mixin = get('Mixin');
  const Loader = get('Loader');

  const loader = new Mixin({
    toggleLoader(e) {
      e === true ? this.loader ? this.loader.set('loading', true) : this.loader = new Loader({ // I hate this
          $container: this.$el,
          type: 'bar',
          classModifiers: 'top',
          loading: true
      }) : this.loader.set('loading', false);
    }
  });

  Tumblr.Fox.loaderMixin = loader;

  return Tumblr.Fox.loaderMixin;
});
