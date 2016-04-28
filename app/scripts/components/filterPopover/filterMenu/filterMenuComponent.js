module.exports = (function filterMenuComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { AutoPaginator, Posts } = Tumblr.Fox;

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
      e.preventDefault();
      const type = $(e.target).data('js-menu-item-link');
      return Tumblr.AutoPaginator.stop(),
      Tumblr.Events.trigger('fox:apiFetch:initial', type);
    }
  });

  Tumblr.Fox.FilterMenuComponent = FilterMenuComponent;

  return Tumblr.Fox;
})
