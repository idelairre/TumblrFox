module.exports = (function filterMenuComponent() {
  const $ = Backbone.$;
  Tumblr.Fox = Tumblr.Fox || {};

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
      console.log('[FILTER SELECTED]', Tumblr.Fox.Loader.options);
      e.preventDefault();
      if (Tumblr.Fox.Loader.options.loading) return;
      const type = $(e.target).data('js-menu-item-link');
      console.log('[FETCHING POSTS]', type);
      return Tumblr.AutoPaginator.stop(),
      Tumblr.Fox.AutoPaginator.reset({ apiFetch: true }),
      Tumblr.Fox.filterPosts(type),
      setTimeout(() => {
        Tumblr.Fox.fetchPosts({
          type: type,
          limit: Tumblr.Fox.options.limit,
          offset: Tumblr.Fox.options.offset
        });
      }, 1);
    }
  });

  Tumblr.Fox.FilterMenuComponent = FilterMenuComponent;

  return Tumblr.Fox;
})
