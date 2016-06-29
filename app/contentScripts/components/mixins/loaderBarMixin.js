module.exports = (function loaderMixin(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { ComponentFetcher } = Tumblr.Fox.Utils;
  const { Loader, Mixin } = ComponentFetcher.getAll('Loader', 'Mixin');

  const LoaderBar = new Mixin({
    toggleLoading(loading) {
      if (!this.loader) {
        this.loader = new Loader({
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
