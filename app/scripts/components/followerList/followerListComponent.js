module.exports = (function followerList() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { debounce } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;
  const { FollowerModel, FollowerItemComponent } = Tumblr.Fox;

  // TODO: create sort options button, add filters (most recently updated, alphabetically, etc...)

  let FollowerList = Backbone.View.extend({
    defaults: {
      offset: 0,
      limit: 25
    },
    initialize(e) {
      this.options = this.defaults;
      this.model = new FollowerModel(),
      this.$followers = this.$('.follower'),
      this.$followers = this.$followers.slice(1, this.$followers.length)
      this.$pagination = this.$('#pagination'), // insert followers before pagination element
      this.$pagination.hide();
      this.clearElements(),
      this.model.fetch().then(() => {
        this.populate(),
        this.bindEvents();
      });
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', debounce(this.onScroll, 100));
    },
    clearElements() {
      this.$followers.each(function() {
        $(this).fadeOut(300, () => {
          $(this).remove();
        });
      });
    },
    onScroll() {
      let followers = this.model.items.slice(this.options.offset, this.options.offset += this.options.limit);
      followers.map(follower => {
        this.renderFollower(follower);
      });
    },
    populate() {
      let followers = this.model.items.slice(0, this.options.limit);
      followers.map(follower => {
        this.renderFollower(follower);
      });
      this.options.offset += followers.length;
    },
    renderFollower(model) {
      let follower = new FollowerItemComponent(model);
      follower.render();
      this.$el.find('.left_column').append(follower.$el);
    }
  });

  if (window.location.href === 'https://www.tumblr.com/following') {
    Tumblr.Fox.FollowerList = new FollowerList({
      el: $('#following')
    });
  }

  return Tumblr.Fox.FollowerList;
})
