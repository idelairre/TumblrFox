module.exports = (function filterMenuComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { get, AutoPaginator, Posts } = Tumblr.Fox;
  const SearchFilters = get('SearchFilters');

  let FilterMenuComponent = Backbone.View.extend({
    defaults: {
      state: {
        dashboard: !0,
        user: !1
      }
    },
    className: 'popover--filter-select-dropdown',
    template: $('#filterMenuTemplate').html(),
    initialize(e) {
      this.state = this.defaults.state;
    },
    render() {
      return this.$el.html(this.template),
      this.resetChecks();
    },
    events: {
      'click [data-js-menu-item]': 'filterAndFetchPosts'
    },
    resetChecks() {
      this.$('i[data-check]').each(function () {
        $(this).hide();
      });
    },
    filterAndFetchPosts(e) {
      if (Tumblr.Fox.Loader.options.loading) {
        return;
      }
      e.preventDefault();
      const type = $(e.target).data('js-menu-item-link');
      this.resetChecks(),
      this.$(`i[data-check="${type}"]`).show(),
      Tumblr.Events.trigger('fox:apiFetch:initial', type);
    }
  });

  Tumblr.Fox.FilterMenuComponent = FilterMenuComponent;

  return Tumblr;
})
