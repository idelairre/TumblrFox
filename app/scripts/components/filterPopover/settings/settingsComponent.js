module.exports = (function settings(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { clone, defer } = _;
  const { get, Popover } = Tumblr.Fox;
  const PopoverComponent = get('PopoverComponent');

  const settingsPopoverTemplate = `
    <script id="settingsPopoverTemplate" type="text/template">
      <i class="icon_search toggle-search nav_icon"></i>
    </script>`;

  const Settings = PopoverComponent.extend({
    className: 'search-settings',
    defaults: {
      popoverOptions: [{
        multipleSelection: false,
        name: 'searchTarget',
        listItems: [
          { icon: 'none', name: 'Search likes', data: 'likes', checked: false },
          { icon: 'none', name: 'Search by user', data: 'user', checked: true },
          { icon: 'none', name: 'Search dashboard', data: 'dashboard', checked: false }
        ]
      }, {
        multipleSelection: false,
        name: 'searchOptions',
        listItems: [
          { icon: 'none', name: 'Tag', data: 'tag', checked: true },
          { icon: 'none', name: 'Full text', data: 'text', checked: false },
        ]
      }]
    },
    template: $(settingsPopoverTemplate).html(),
    initialize(e) {
      this.options = Object.assign({}, this.defaults, e);
      this.state = Tumblr.Fox.state;
      this.listenTo(Tumblr.Events, 'fox:setSearchState', ::this.setSearchStateMenu);
      this.listenTo(Tumblr.Events, 'fox:setSearchOption', ::this.setSearchOptionMenu);
    },
    setSearchStateMenu() {
      if (!Tumblr.Fox.options.cachedTags && this.state.likes) {
        this.options.popoverOptions[1].listItems.splice(0, 1);
      } else {
        if (this.options.popoverOptions[1].listItems[0].name !== 'Tag') {
          this.options.popoverOptions[1].listItems.unshift({ icon: 'none', name: 'Tag', data: 'tag', checked: false });
        }
      }
    },
    setSearchOptionMenu(state) {
      if (state === 'text') {
        if (this.options.popoverOptions[0].listItems[1].data !== 'user') {
          return;
        }
        this.options.popoverOptions[0].listItems[0].checked = true;
        this.options.popoverOptions[0].listItems.splice(1, 1);
      } else {
        const item = { icon: 'none', name: 'Search by user', data: 'user', checked: false };
        const shift = this.options.popoverOptions[0].listItems[1];
        this.options.popoverOptions[0].listItems[0].checked = true;
        this.options.popoverOptions[0].listItems.push(shift);
        this.options.popoverOptions[0].listItems[1] = item;
      }
    },
    render() {
      this.$el.html(this.template);
      this.initialized = !0;
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
      if (this.initialized) {
        if (setting === 'tag' || setting === 'text') {
          Tumblr.Events.trigger('fox:setSearchOption', setting);
        } else {
          Tumblr.Fox.Posts.set('tagSearch', setting);
          Tumblr.Events.trigger('fox:setSearchState', setting);
        }
      }
    }
  });

  Tumblr.Fox.Settings = Settings;

  return Tumblr;
});
