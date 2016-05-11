module.exports = (function events() {
  Tumblr.Fox = Tumblr.Fox || {};

  const tumblr = Object.assign({}, Tumblr.Events, Tumblr.Prima.Events, Backbone.Events);

  Tumblr.Fox.Events = {
    ignore: [
      'LSLog:impression',
      'DOMEventor:updateRect',
      'DOMEventor:keyup:backspace',
      'posts:destroyed',
      'postsView:createPost',
      'Header:mouseenter',
      'Header:mouseleave',
      'VideoPlayer:timeupdate',
      'DOMEventor:keydown:alt',
      'DOMEventor:keydown:ctrl',
      'LSLog:video_loop',
      'LSLog:video_auto_play',
      'toaster:updateMessagingUnreadCounts',
      'TumblelogPopover:mouseenter_posts',
      'post:embed:stateChange',
      'VideoPlayer:looped',
      'DOMEventor:keydown:backspace',
      'CrtControl:newPlayer',
      'CrtControl:playerCreated',
      'CrtPlayer:ready',
      'VideoPlayer:autoplay',
      'VideoPlayer:initialLoad',
      'VideoPlayer:cacheUnload',
      'fox:postFetch:started',
      'fox:postFetch:finished',
      'DOMEventor:flatscroll'
    ],
    log(e) {
      if (!Tumblr.Fox.Events.ignore.includes(e) && Tumblr.Fox.options.logging) {
        if (e.includes('fox')) {
          console.log('%c[TUMBLRFOX] %o', 'color:orange; font-size: 9pt', arguments);
          return;
        }
        console.log('[LOG]', arguments);
      }
    },
    start() {
      tumblr.on('all', this.log);
    },
    stop() {
      tumblr.off('all', this.log);
    }
  };

  return Tumblr.Events;
});
