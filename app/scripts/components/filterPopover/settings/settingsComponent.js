module.exports = (function settings() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { defer } = _;
  const { SettingsPopoverComponent, get, require } = Tumblr.Fox;
  const PopoverComponent = get('PopoverComponent');
  const SearchFilters = get('SearchFilters');

  const settingsPopoverTemplate = `
    <script id="settingsPopoverTemplate" type="text/template">
      <i class="icon_search toggle-search nav_icon"></i>
    </script>`;

  let Settings = PopoverComponent.extend({
    className: 'search-settings',
    template: $(settingsPopoverTemplate).html(),
    initialize(e) {
      return this.options = Object.assign(e, {});
    },
    render() {
      return this.$el.html(this.template);
    },
    events: {
      'click .toggle-search': 'togglePopover'
    },
    togglePopover() {
      this.popover || (this.popover = new SettingsPopoverComponent({
        pinnedTarget: this.$el,
        pinnedSide: 'bottom'
      }),
      this.popover.render(),
      this.listenTo(this.popover, 'close', this.onPopoverClose));
    },
    hidePopover() {
      this.popover && this.popover.hide();
    },
    onPopoverClose() {
      defer(() => {
        this.popover = null
      });
    }
  })

  Tumblr.Fox.Settings = Settings;

  return Tumblr.Fox;
})
