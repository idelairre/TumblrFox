module.exports = (function filterMenuComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { get, AutoPaginator } = Tumblr.Fox;
  const SearchFilters = get('SearchFilters');

  let FilterMenuComponent = Backbone.View.extend({
    defaults: {
      state: {
        likes: !1,
        dashboard: !1,
        user: !0
      },
      disabled: !1
    },
    className: 'popover--filter-select-dropdown',
    template: $('#filterMenuTemplate').html(),
    initialize(e) {
      this.state = this.defaults.state,
      this.disabled = this.defaults.disabled,
      this.listenTo(Tumblr.Events, 'fox:setSearchState', this.toggleLikes);
    },
    render() {
      return this.$el.html(this.template),
      Tumblr.Events.trigger('fox:setFilter', { loggingData: { post_type: 'ANY' } }),
      this.resetChecks(),
      this.$('i[data-check="any"]').show();
    },
    events: {
      'click [data-js-menu-item]': 'toggleSelection'
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'peepr-open-request', this.set('disabled', !0));
      this.listenTo(Tumblr.Events, 'peepr:close', this.set('disabled', !1));
    },
    resetChecks() {
      this.$('i[data-check]').each(function () {
        $(this).hide();
      });
    },
    setState(state) {
      for (let key in this.state) {
        this.state[key] = !1;
        if (key.includes(state)) {
          this.state[key] = !0;
        }
      }
    },
    toggleLikes(state) {
      this.setState(state);
      if (state === 'likes') {
        this.$('[data-js-menu-item-link="likes"]').hide();
      } else {
        this.$('[data-js-menu-item-link="likes"]').show();
      }
    },
    toggleSelection(e) { // NOTE: make sure to put this back while the states are half-functional
      e.preventDefault();
      if (this.disabled) {
        return;
      }
      const type = $(e.target).data('js-menu-item-link');
      this.resetChecks(),
      this.$(`i[data-check="${type}"]`).show();
      if (this.state.dashboard) {
        this.filterAndFetchPosts(type);
      } else {
        this.selectFilter(type);
      }
    },
    selectFilter(type) {
      Tumblr.Events.trigger('fox:setFilter', { loggingData: { post_type: type.toUpperCase() } });
    },
    filterAndFetchPosts(type) {
      Tumblr.Events.trigger('fox:apiFetch:initial', type);
    }
  });

  Tumblr.Fox.FilterMenuComponent = FilterMenuComponent;

  return Tumblr.Fox.FilterMenuComponent;
})
