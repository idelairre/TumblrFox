module.exports = (function filterPopoverContainer(Tumblr, Backbone, _) {
  const { $ } = Backbone;
  const { assign } = _;
  const { ComponentFetcher } = Tumblr.Fox.Utils;
  const { FilterPopoverComponent, PrimaComponent } = ComponentFetcher.getAll('FilterPopoverComponent', 'PrimaComponent');

  const FilterPopoverContainer = PrimaComponent.extend({
    name: 'FilterPopover',
    initialize(e) {
      this.options = assign({}, e);
    },
    view(e) {
      assign(e, {
        pinnedTarget: $('#filter_button'),
        isFixedPosition: true,
        autoTeardown: false,
        teardownOnEscape: false
      });
      return new FilterPopoverComponent(e);
    },
    show() {
      this.view.show();
    },
    render() {
      this.view.render();
      this.trigger('append');
    }
  });

  Tumblr.Fox.register('FilterPopoverContainer', FilterPopoverContainer);
});
