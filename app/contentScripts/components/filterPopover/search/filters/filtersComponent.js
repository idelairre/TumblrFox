function filters(Tumblr, Backbone, _) {
  const { assign, pick } = _;
  const { ComponentFetcher } = Tumblr.Fox.Utils;
  const { BlogSearchPopover, FiltersDropDownComponent, PeeprBlogSearch, SearchFiltersPopover } = ComponentFetcher.getAll('BlogSearchPopover', 'FiltersDropDownComponent', 'PeeprBlogSearch', 'SearchFiltersPopover');

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
}

filters.prototype.dependencies = ['FiltersDropDownComponent'];

module.exports = filters;
