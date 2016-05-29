module.exports = (function followerSearch(Tumblr, Backbone, _) {
  const { defer } = _;
  const { Popover } = Tumblr.Fox;

  // {
  //   header: 'Input',
  //   listItems: [
  //     { icon: 'icon_filter', name: 'Filter following', checked: false },
  //     { icon: 'icon_search', name: 'Search for Tumblelog', checked: true }
  //   ]
  // }]

  const FollowerSearch = Backbone.View.extend({
    defaults: {
      state: {
        search: !1,
        follow: !0
      },
      popoverOptions: [{
        header: 'Sort',
        listItems: [
          { icon: 'icon_post_text', name: 'Alphabetically', checked: false },
          { icon: 'icon_activity', name: 'Most recently updated', checked: false },
          { icon: 'icon_followers', name: 'Order followed', checked: true }
        ]
      }]
    },
    initialize() {
      this.state = this.defaults.state;
      this.popoverOptions = this.defaults.popoverOptions;
      this.$form = this.$('form');
      this.$form.css('display', 'inline-block');
      this.$form.css('width', '89%');
      this.$el.css('background', '#f8f8f8 11px 5px no-repeat');
      this.$el.css('padding', '5px 10px 5px 0px');
      this.$el.prepend('<div class="follower-filter"><i class="icon_filter"></i></div>');
      this.$followerFilter = this.$('.follower-filter');
      this.$input = this.$el.find('input.text_field');
    },
    events: {
      'click button.chrome': 'follow',
      'click .follower-filter': 'togglePopover'
    },
    togglePopover(e) { // NOTE: this is broken
      e.preventDefault();
      console.log('[TOGGLE POPOVER]', e);
      this.popover || (this.popover = new Popover({
        pinnedTarget: this.$followerFilter,
        pinnedSide: 'bottom',
        class: 'popover--follower-popover',
        selection: 'checkmark',
        multipleSelection: false,
        items: this.popoverOptions,
        onSelect: (e) => {
          Tumblr.Events.trigger('fox:fetchFollowers', e);
        }
      }),
      this.popover.render(),
      this.listenTo(this.popover, 'close', this.onPopoverClose));
    },
    hidePopover() {
      this.popover && this.popoSettingsPopoverComponentver.hide();
    },
    onPopoverClose() {
      defer(() => {
        this.popover = null;
      });
    },
    follow(e) {
      console.log('[FOLLOW]', e);
      e.preventDefault();
    }
  });

  Tumblr.Fox.FollowerSearch = FollowerSearch;
});
