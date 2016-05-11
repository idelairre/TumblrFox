module.exports = (function filterPopoverContainer(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { get } = Tumblr.Fox;
  const { FilterPopoverComponent } = Tumblr.Fox;
  const PrimaComponent = get('PrimaComponent');

  const FilterPopoverContainer = PrimaComponent.extend({
    name: 'FilterPopover',
    view(e) {
      Object.assign(e, {
        pinnedTarget: $('#filter_button'),
        isFixedPosition: !0,
        autoTeardown: !1,
        teardownOnEscape: !1
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

  Tumblr.Fox.FilterPopoverContainer = FilterPopoverContainer;

  return Tumblr.Fox.FilterPopoverMenu;
});
