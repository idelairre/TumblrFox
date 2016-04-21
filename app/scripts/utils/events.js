module.exports = (function events() {
  Tumblr.Fox = Tumblr.Fox || {};

  const tumblr = Object.assign({}, Tumblr.Events, Tumblr.Prima.Events, Backbone.Events);

  Tumblr.Fox.Events = {
    ignore: [
      'DOMEventor:flatscroll',
      'LSLog:impression',
      'DOMEventor:updateRect',
      'postsView:createPost',
      'postsView',
      'posts:destroyed',
      'Header:mouseenter',
      'Header:mouseleave',
      'VideoPlayer:timeupdate',
      'DOMEventor:keydown:alt',
      'DOMEventor:keydown:ctrl',
      'LSLog:video_loop',
      'toaster:updateMessagingUnreadCounts',
      'TumblelogPopover:mouseenter_posts',
      'post:embed:stateChange',
      'VideoPlayer:looped'
    ],
    log(e) {
      if (!Tumblr.Fox.Events.ignore.includes(e)) {
        console.log('[LOG]', arguments);
      }
    },
    start() {
      window.addEventListener('response:posts', Tumblr.Fox.handOffPosts);
      tumblr.on('all', this.log);
    },
    stop() {
      window.removeEventListener('response:posts', Tumblr.Fox.handOffPosts);
      tumblr.off('all', this.log);
    }
  }

  return Tumblr.Fox;
});
