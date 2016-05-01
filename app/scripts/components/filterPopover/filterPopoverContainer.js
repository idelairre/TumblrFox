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
        pinnedTarget: $('#filter'),
        isFixedPosition: !0,
        autoTeardown: !1,
        teardownOnEscape: !1
      }),
      new FilterPopoverComponent(e)
    },
    show() {
      this.view.show()
    },
    render() {
      return this.view.render(),
      this.trigger('append'),
      this
    }
  })

  let filterPopoverMenu = new FilterPopoverContainer();

  $('#filter').click(() => {
    if (!Tumblr.Fox.options.rendered) {
      filterPopoverMenu.render();
      Tumblr.Fox.options.rendered = true;
      return;
    }
    filterPopoverMenu.show();
  });

  if (Tumblr.Fox.options.logging) {
    Tumblr.Fox.Events.start();
  }
  Tumblr.Fox.Loader.start();

  Tumblr.Fox.FilterPopoverContainer = FilterPopoverContainer;
  Tumblr.Fox.filterPopoverMenu = filterPopoverMenu;

  return Tumblr;
})
