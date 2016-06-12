module.exports = (function followerSearch(Tumblr, Backbone, _) {
  const { View } = Backbone;
  const { get } = Tumblr.Fox;
  const { assign, defer, omit } = _;
  const Popover = get('PopoverComponent');

  const FollowerSearch = View.extend({
    defaults: {
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
      this.state = e.state;
      this.options = assign({}, this.defaults, omit(e, 'state'));
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
    togglePopover(e) {
      e.preventDefault();
      this.popover || (this.popover = new Popover({
        pinnedTarget: this.$followerFilter,
        pinnedSide: 'bottom',
        class: 'popover--follower-popover',
        selection: 'checkmark',
        items: this.options.popoverOptions,
        onSelect: (e) => {
          if (this.state.get(e)) {
            return;
          }
          Tumblr.Events.trigger('fox:following:state', e);
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
      e.preventDefault();
      e.stopPropagation();
      const tumblelog = this.$input.val();
      Tumblr.follow({
        tumblelog,
        source: 'FOLLOW_SOURCE_FOLLOWING_PAGE'
      });
      if (this.state.get('orderFollowed')) {
        Tumblr.Events.trigger('fox:following:refresh');
      }
    }
  });

  Tumblr.Fox.register('FollowerSearchComponent', FollowerSearch);
});
