module.exports = (function followList() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;

  let FollowList = Backbone.View.extend({
    initialize(e) {
      this.items = Tumblelog.collection,
      this.$pagination = this.$('#pagination'),
      this.$pagination.hide(),
      this.fetch();
      console.log('[FOLLOW LIST]', this);
    },
    fetch() { // NOTE: maybe this is more appropriate for a model?
      const slug = {
        url: `https://api.tumblr.com/v2/blog/${currentUser().id}/followers`,
        limit: 50
      };
      const req = new CustomEvent('chrome:fetch:followers', {
        detail: slug
      });
      const callback = (response) => {
        window.removeEventListener('chrome:response:followers', callback);
      }
      window.dispatchEvent(req);
      window.addEventListener('chrome:response:followers', callback);
    },
  });

  Tumblr.Fox.FollowList = new FollowList({
    el: $('#following')
  });

  return Tumblr.Fox.FollowList;
})
