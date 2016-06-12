module.exports = (function loaderMixin(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { get } = Tumblr.Fox;
  const Mixin = get('Mixin');
  const Loader = get('Loader');

  const LoaderBar = new Mixin({
    toggleLoading(loading) {
      console.log('[LOADING]', loading);
      if (!this.loader) {
        this.loader = new Loader({ // I hate this
           $container: this.$el,
           type: 'bar',
           classModifiers: 'top',
           loading: true
       });
      }
      this.loader.set('loading', loading);
    }
  });

  Tumblr.Fox.register('LoaderMixin', LoaderBar);
});
