module.exports = (function settingsIcon() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { defer, bind } = _;
  const { SettingsPopoverComponent, get } = Tumblr.Fox;
  const PopoverComponent = get('PopoverComponent');

  const settingsPopoverTemplate = `
    <script id="settingsPopoverTemplate" type="text/template">
      <i class="icon_search toggle-search nav_icon"></i>
    </script>`;

  let SettingsIcon = PopoverComponent.extend({
    className: 'search-settings',
    template: $(settingsPopoverTemplate).html(),
    initialize(e) {
      e = Object.assign(e, {}),
      this.showPopover = !1,
      this.bindEvents();
    },
    events: {
      "click .toggle-search": "setPopover"
    },
    bindEvents() {
      this.listenTo(this, 'change:showPopover', this.togglePopover);
    },
    setPopover() {
      this.set('showPopover', this.showPopover = !this.showPopover);
    },
    togglePopover(e) {
      if (e.showPopover) {
        !this.popover ? this.popover = new SettingsPopoverComponent({
            pinnedTarget: this.$el,
            preventInteraction: !1
        }).render() : this.popover.show()
      } else {
        this.hidePopover();
      }
    },
    hidePopover() {
      this.popover.hide();
    }
  })

  Tumblr.Fox.SettingsIcon = SettingsIcon;

  return Tumblr.Fox;
})
