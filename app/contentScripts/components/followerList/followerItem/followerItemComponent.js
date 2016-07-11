module.exports = (function followerItem(Tumblr, Backbone, _) {
  const { $, View } = Backbone;
  const { isNumber, template } = _;
  const { constants, Utils } = Tumblr.Fox;
  const { TemplateCache, Time } = Utils;

  const FollowerItem = View.extend({
    template: template(TemplateCache.get('followerItemTemplate')),
    className: 'follower clearfix',
    initialize(options) {
      this.model = options.model;
      this.model.set('avatar', this.model.get('avatar_url'));
      if (isNumber(this.model.get('updated'))) {
        this.model.set('updated', `Updated ${Utils.Time.prettyDate(Utils.Time.fromTumblrTime(this.model.get('updated')))}`);
      }
      this.model.set('formkey', constants.formkey);
    },
    render() {
      this.$el.removeAttributes({
        ignore: 'class'
      });
      if (Tumblr.Prima.Models.Tumblelog.collection.indexOf(this.model) % 2 === 0) {
        this.$el.addClass('alt');
      }
      this.$el.html(this.template(this.model));

      const info = {
        el: this.$el.find('.poptica_header').find('.user_dropdown_lockup'),
        model: this.model
      };

      info.infoPopover = {
        el: this.$el.find('.poptica_header'),
        auto_show: false,
        trigger: this.$el.find('.poptica_header'),
        targetPost: this.$el.find('.poptica_header').parent(),
        glassless: true,
        model: this.model,
        standalone: true,
        show_flag_button: false
      };

      this.$popover = new Tumblr.Prima.Snowman(info);
      this.$el.data('has-popover', true);
      this.$el.data('ref-popover', this.$popover);
    },
    events: {
      'click button.unfollow_button': 'unfollow',
      'click button.follow_button': 'follow'
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
    remove() {
      View.prototype.remove.apply(this);
    }
  });

  Tumblr.Fox.register('FollowerItemComponent', FollowerItem);

});
