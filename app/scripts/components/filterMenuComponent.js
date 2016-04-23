module.exports = (function filterMenuComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { AutoPaginator, fetchPosts, filterPosts } = Tumblr.Fox;

  let FilterMenuComponent = Backbone.View.extend({
    className: 'popover--filter-select-dropdown',
    template: $('#filterMenuTemplate').html(),
    render() {
      return this.$el.html(this.template);
    },
    events: {
      'click [data-js-menu-item]': 'filterAndFetchPosts'
    },
    filterAndFetchPosts(e) {
      if (Tumblr.Fox.Loader.options.loading) return;
      console.log('[FILTER SELECTED]');
      e.preventDefault();
      const type = $(e.target).data('js-menu-item-link');
      console.log('[FETCHING POSTS]', type);
      return Tumblr.AutoPaginator.stop(),
      AutoPaginator.reset({ apiFetch: true }),
      filterPosts(type),
      setTimeout(() => {
        fetchPosts({
          type: type,
          limit: Tumblr.Fox.apiSlug.limit,
          offset: Tumblr.Fox.apiSlug.offset
        });
      }, 1);
    }
  });

  Tumblr.Fox.FilterMenuComponent = FilterMenuComponent;

  return Tumblr.Fox;
})
