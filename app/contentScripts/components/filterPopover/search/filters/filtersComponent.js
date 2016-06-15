module.exports = (function filterDropdown(Tumblr, Backbone, _) {
  const { assign, pick } = _;
  const { get } = Tumblr.Fox;
  const PeeprBlogSearch = get('PeeprBlogSearch');

  const Filters = PeeprBlogSearch.prototype.subviews.filters.constructor;

  const FiltersComponent = Filters.extend({
    initialize(options) {
      assign(this, pick(options, ['model', 'state', 'searchOptions']));
      const { FiltersDropDown } = options;
      this.showPopover = () => {
        this.popover = new FiltersDropDown({
          pinnedTarget: this.$el,
          model: this.model,
          state: this.state,
          searchOptions: this.searchOptions,
          preventInteraction: true
        });
        this.popover.render();
        this.listenTo(this.popover, 'close', this.onPopoverClose);
      };
      Filters.prototype.initialize.apply(this, arguments);
    }
  });

  Tumblr.Fox.register('FiltersComponent', FiltersComponent);
});
