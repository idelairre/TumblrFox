import ComponentFetcher from '../../utils/componentFetcherUtil';

const { Mixin, Loader } = ComponentFetcher.getAll('Mixin', 'Loader');

const LoaderMixin = new Mixin({
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

module.exports = LoaderMixin;
