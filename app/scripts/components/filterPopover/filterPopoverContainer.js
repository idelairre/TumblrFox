module.exports = (function filterPopoverContainer() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { getComponent, get } = Tumblr.Fox;
  const { FilterPopoverComponent } = Tumblr.Fox;
  const PrimaComponent = get('PrimaComponent');

  let FilterPopoverContainer = PrimaComponent.extend({
    name: 'FilterPopover',
    view(e) {
      return Object.assign(e, {
        pinnedTarget: $('#filter_button'),
        isFixedPosition: !0,
        autoTeardown: !1,
        teardownOnEscape: !1
      }),
      new FilterPopoverComponent(e);
    },
    show() {
      this.view.show()
    },
    render() {
      return this.view.render(),
      this.trigger('append'),
      this;
    }
  })

  Tumblr.Fox.FilterPopoverContainer = FilterPopoverContainer;

  return Tumblr.Fox.FilterPopoverMenu;
})
