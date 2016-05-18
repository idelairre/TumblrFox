module.exports = (function settings(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { defer } = _;
  const { get, Popover } = Tumblr.Fox;
  const PopoverComponent = get('PopoverComponent');

  const settingsPopoverTemplate = `
    <script id="settingsPopoverTemplate" type="text/template">
      <i class="icon_search toggle-search nav_icon"></i>
    </script>`;

  const Settings = PopoverComponent.extend({
    className: 'search-settings',
    defaults: {
      state: {
        likes: !1,
        dashboard: !1,
        user: !0
      },
      popoverOptions: [{
        listItems: [
          { icon: 'none', name: 'Search likes', checked: false },
          { icon: 'none', name: 'Search by user', checked: true },
          { icon: 'none', name: 'Search dashboard', checked: false }
        ]
      }]
    },
    template: $(settingsPopoverTemplate).html(),
    initialize(e) {
      this.options = Object.assign({}, this.defaults, e);
      if (!Tumblr.Fox.options.cachedTags) {
        this.options.popoverOptions[0].listItems.splice(0, 1);
      }
    },
    render() {
      this.$el.html(this.template);
    },
    events: {
      'click .toggle-search': 'togglePopover'
    },
    togglePopover() {
      this.popover || (this.popover = new Popover({
        pinnedTarget: this.$el,
        pinnedSide: 'bottom',
        class: 'popover--settings-popover',
        selection: 'checkmark',
        multipleSelection: false,
        items: this.options.popoverOptions,
        onSelect: this.onSelect
      }),
      this.popover.render(),
      this.listenTo(this.popover, 'close', this.onPopoverClose));
    },
    hidePopover() {
      this.popover && this.popover.hide();
    },
    onPopoverClose() {
      defer(() => {
        this.popover = null;
      });
    },
    onSelect(setting) {
      setting = setting.split(' ');
      setting = setting[setting.length - 1];
      if (this.initialized) {
        Tumblr.Fox.Posts.set('tagSearch', setting);
        Tumblr.Events.trigger('fox:setSearchState', setting);
      }
    }
  });

  Tumblr.Fox.Settings = Settings;

  return Tumblr;
});
