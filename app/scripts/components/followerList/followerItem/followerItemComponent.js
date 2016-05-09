module.exports = (function followerItem() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { template } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;
  const { FollowerModel, constants } = Tumblr.Fox;

  $.fn.removeAttributes = function(args) {
    let ignore = args.ignore;
    return this.each(function() {
      let attributes = $.map(this.attributes, (item) => {
        if (item.name !== ignore) {
          return item.name;
        }
      });
      let elem = $(this);
      $.each(attributes, (i, item) => {
        elem.removeAttr(item);
      });
    });
  }

  const followerTemplate = `
    <script type="text/template">
      <a href="http://<%= attributes.name %>.tumblr.com/" class="avatar" style="background-image:url('<%= attributes.avatar.url %>')" data-tumblelog-popover="<%- JSON.stringify(attributes) %>">
        <img class="avatar_img" alt="" src="<%= attributes.avatar.url %>" width="40" height="40">
      </a>
      <div class="info">
        <div class="name">
          <a href="http://<%= attributes.name %>.tumblr.com/"><%= attributes.name %></a>
        </div>
        <div class="description">
          <span class="last_updated" style="color:#606060;">Updated <%= attributes.updated %></span>
        </div>
      </div>
      <div class="poptica_header popover_standalone">
        <a data-name="<%= attributes.name %>" class="info_popover_button nav_icon user_dropdown_lockup">
          <span class="snowman-container">
            <i data-subscription-indicator="" class="subscribe-activity"></i>
            <i class="snowman-icon"></i>
          </span>
        </a>
      </div>
      <div class="controls">
        <span id="loading_<%= attributes.name %>" class="loading_animation" style="display: none;"></span>
        <button class="chrome clear big unfollow_button" id="unfollow_button_<%= attributes.name %>" data-name="<%= attributes.name %>" data-formkey="<%= attributes.formkey %>">Unfollow</button>
        <button class="chrome blue big follow_button" id="follow_button_<%= attributes.name %>" style="display: none;" data-name="<%= attributes.name %>" data-formkey="<%= attributes.formkey %>">Follow</button>
      </div>
    </script>`;

  let FollowerItem = Backbone.View.extend({
    template: template($(followerTemplate).html()),
    className: 'follower clearfix',
    initialize(e) {
      this.model = e;
    },
    render() {
      this.$el.removeAttributes({ ignore: 'class' });
      if (this.model.collection.indexOf(this.model) % 2 === 0) {
        this.$el.addClass('alt');
      }
      this.model.attributes.avatar = this.model.attributes.avatar[1];
      this.model.attributes.updated = Tumblr.Fox.prettyDate(Tumblr.Fox.fromTumblrTime(this.model.attributes.updated));
      this.model.attributes.can_subscribe = true; // TODO: findout how to get this data
      this.model.attributes.formkey = constants.formkey;
      this.$el = this.$el.html(this.template(this.model));
      this.$followButton = this.$el.find('button.follow_button');
      this.$unfollowButton = this.$el.find('button.unfollow_button');
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
      'click button.follow_button' : 'follow',
      'click div.poptica_header': 'togglePopover'
    },
    follow(e) {
      e.preventDefault();
      this.$followButton.hide();
      this.$unfollowButton.show();
      console.log('[FOLLOW] called');
    },
    unfollow(e) {
      e.preventDefault();
      this.$followButton.show();
      this.$unfollowButton.hide();
      console.log(e.target);
      console.log('[UNFOLLOW] called');
    },
    togglePopover(e) {
      e.preventDefault();
      this.$popover.show(),
      console.log('[POPOVER] open');
    }
  });

  Tumblr.Fox.FollowerItemComponent = FollowerItem;

  return Tumblr.Fox.FollowerItemComponent;
})

/**
* @param {Object} Ajax request params. Recognized Parameters:
*   "tumblelog" {String} Tumblelog name.
*   "source" {String} The follow source (all caps).
*/
// follow(tumblelog, source) {
//   return Tumble.follow({ tumblelog, source });
// },
