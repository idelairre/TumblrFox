module.exports = (function followerSearch(Tumblr, Backbone, _) {
  const { assign, defer } = _;
  const { Popover } = Tumblr.Fox;

  const FollowerSearch = Backbone.View.extend({
    defaults: {
      state: {
        search: !1,
        follow: !0
      },
      popoverOptions: [{
        header: 'Sort',
        name: 'sort',
        multipleSelection: false,
        listItems: [
          { icon: 'icon_post_text', name: 'Alphabetically', data: 'alphabetically', checked: false },
          { icon: 'icon_activity', name: 'Most recently updated', data: 'recentlyUpdated', checked: false },
          { icon: 'icon_followers', name: 'Order followed', data: 'orderFollowed', checked: true }
        ]
      }]
    },
    initialize(e) {
      this.state = this.defaults.state;
      this.options = assign({}, this.defaults, e);
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
        items: this.options.popoverOptions,
        onSelect: (e) => {
          console.log('[SELECTION]', e);
          Tumblr.Events.trigger('fox:fetchFollowers', e);
        }
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
    follow(e) {
      console.log('[FOLLOW]', e);
      e.preventDefault();
    }
  });

  Tumblr.Fox.FollowerSearch = FollowerSearch;
});
