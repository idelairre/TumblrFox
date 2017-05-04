import $ from 'jquery';
import { View } from 'backbone';
import { isNumber, template } from 'lodash';
import { Time } from '../../../utils';
import followingItemTemplate from './followingItemTemplate.html';

(function ($) {
  $.fn.removeAttributes = function(args) {
    const ignore = args.ignore;
    return this.each(function() {
      const attributes = $.map(this.attributes, item => {
        if (typeof ignore !== 'undefined' && item.name !== ignore) {
          return item.name;
        }
      });
      const elem = $(this);
      $.each(attributes, (i, item) => {
        elem.removeAttr(item);
      });
    });
  };
})(jQuery);

// https://api.tumblr.com/v2/blog/${user}/avatar/128

const FollowingItem = View.extend({
  template: template(followingItemTemplate),
  className: 'follower clearfix',
  initialize(options) {
    this.model = options.model;
    this.model.set('avatar_url', `https://api.tumblr.com/v2/blog/${this.model.get('name')}/avatar/128`);
    if (isNumber(this.model.get('updated'))) {
      this.model.set('updated', `Updated ${Time.prettyDate(this.model.get('updated'))}`);
    }
    this.model.set('formKey', Tumblr.Fox.constants.formKey);
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

module.exports = FollowingItem;
