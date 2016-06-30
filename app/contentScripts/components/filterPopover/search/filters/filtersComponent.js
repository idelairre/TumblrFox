module.exports = (function filters(Tumblr, Backbone, _, BlogSearchPopover, FiltersDropDownComponent, PeeprBlogSearch, SearchFiltersPopover) {
  const { assign, pick } = _;
  const { ComponentFetcher } = Tumblr.Fox.Utils;

  const Filters = PeeprBlogSearch.prototype.subviews.filters.constructor;

  const FilterPopoverContainer = SearchFiltersPopover.extend({
    Subview: FiltersDropDownComponent
  });

  const FiltersIconComponent = Filters.extend({
    initialize(options) {
      assign(this, pick(options, ['model', 'state']));
      Filters.prototype.initialize.apply(this, arguments);
    },
    showPopover() {
      if (!this.popover) {
        this.popover = new FilterPopoverContainer({
          pinnedTarget: this.$el,
          model: this.model,
          state: this.state,
          preventInteraction: true
        });
        this.popover.render();
        this.listenTo(this.popover, 'close', this.onPopoverClose);
      }
    },
    onPopoverClose() {
      Filters.prototype.onPopoverClose.apply(this, arguments);
    }
  });

  Tumblr.Fox.register('FiltersComponent', FiltersIconComponent);

});
