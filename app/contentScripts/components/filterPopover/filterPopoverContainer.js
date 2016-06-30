module.exports = (function filterPopoverContainer(Tumblr, Backbone, _, FilterPopoverComponent, PrimaComponent) {
  const { $ } = Backbone;
  const { assign } = _;
  const { ComponentFetcher } = Tumblr.Fox.Utils;

  const FilterPopoverContainer = PrimaComponent.extend({
    name: 'FilterPopover',
    initialize(e) {
      this.options = assign({}, e);
    },
    view(e) {
      assign(e, {
        pinnedTarget: $('#filter'),
        isFixedPosition: true,
        autoTeardown: false, // NOTE: do not touch these
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
      return this;
    }
  });

  Tumblr.Fox.register('FilterPopoverContainer', FilterPopoverContainer);

});
