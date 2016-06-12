module.exports = (function followerItem(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { template } = _;
  const { constants, Utils } = Tumblr.Fox;
  const { TemplateCache, Time } = Utils

  $.fn.removeAttributes = function (args) {
    const ignore = args.ignore;
    return this.each(function () {
      const attributes = $.map(this.attributes, item => {
        if (item.name !== ignore) {
          return item.name;
        }
      });
      const elem = $(this);
      $.each(attributes, (i, item) => {
        elem.removeAttr(item);
      });
    });
  };

  const FollowerItem = Backbone.View.extend({
    template: template(TemplateCache.get('followerItemTemplate')),
    className: 'follower clearfix',
    initialize(e) {
      this.model = e.model;
      this.model.attributes.avatar = this.model.attributes.avatar_url || this.model.attributes.avatar[1].url;
      this.model.attributes.updated = Time.prettyDate(Time.fromTumblrTime(this.model.attributes.updated));
      this.model.attributes.formkey = constants.formkey;
    },
    render() {
      this.$el.removeAttributes({ ignore: 'class' });
      if (this.model.collection.indexOf(this.model) % 2 === 0) {
        this.$el.addClass('alt');
      }
      this.$el.html(this.template(this.model));
      this.$popover = new Tumblr.TumblelogPopover.PopticaInfoPopover({
        el: this.$el.find('.poptica_header'),
        auto_show: false,
        trigger: this.$el.find('.info_popover_button'),
        targetPost: this.$el,
        recipient: this.model.get('name'),
        url: this.model.get('url'),
        glassless: true,
        skip_glass: false,
        model: this.model,
        standalone: true,
        show_user_controls: false,
        show_flag_button: false,
        asks: true,
        can_receive_messages: this.model.get('can_message'),
        share_following: this.model.get('share_following'),
        likes: this.model.get('share_likes')
      });
      this.$el.data('has-popover', true);
      this.$el.data('ref-popover', this.$popover);
    },
    events: {
      'click button.unfollow_button': 'unfollow',
      'click button.follow_button': 'follow',
      'click div.poptica_header': 'togglePopover'
    },
    follow(e) {
      e.stopPropagation();
      e.preventDefault();
      const $followButton = $(e.currentTarget);
      const $unfollowButton = $(e.currentTarget).prev();
      const tumblelog = this.model.get('name');
      Tumblr.follow({
        tumblelog: tumblelog,
        source: 'FOLLOW_SOURCE_FOLLOWING_PAGE'
      }, {
        success() {
          $(`#loading_${tumblelog}`).show();
          $unfollowButton.show();
          $followButton.hide();
        },
        complete() {
          $(`#loading_${tumblelog}`).hide();
        }
      });
      this.capturing = (Tumblr.Capture) ? new Tumblr.Capture.CrushClick() : null;
    },
    unfollow(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log($(e.currentTarget).next());
      const $followButton = $(e.currentTarget).next();
      const $unfollowButton = $(e.currentTarget);
      const tumblelog = this.model.get('name');
      Tumblr.unfollow({
        tumblelog: tumblelog,
        source: 'UNFOLLOW_SOURCE_FOLLOWING_PAGE'
      }, {
        success() {
          $(`#loading_${tumblelog}`).hide();
          $unfollowButton.hide();
          $followButton.show();
        },
        complete() {
          $(`#loading_${tumblelog}`).hide();
        }
      });
      this.capturing = Tumblr.Capture ? new Tumblr.Capture.CrushClick() : null;
    },
    togglePopover(e) {
      e.preventDefault();
      this.$popover.show(),
      console.log('[POPOVER] open');
    }
  });

  Tumblr.Fox.register('FollowerItemComponent', FollowerItem);
});
