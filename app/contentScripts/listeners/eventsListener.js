module.exports = (function eventsListener(Tumblr, Backbone, _, Listener) {
  const { assign, pick } = _;

  const EventsListener = Listener.extend({
    initialize() {
      this.ignore = [
        'fox:updateTags',
        'LSLog:impression',
        'DOMEventor:updateRect',
        'DOMEventor:keyup:backspace',
        'posts:destroyed',
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
        'DOMEventor:flatscroll'
      ];
      this.listenToOnce(Tumblr.Fox, 'initialized', () => {
        if (Tumblr.Fox.options.get('logging')) {
          this.start();
        }
      });
    },
    log(e) {
      if (!this.ignore.includes(e)) {
        if (e.includes('fox')) {
          console.log('%c[TUMBLRFOX] %o', 'color:orange; font-size: 9pt', arguments);
          return;
        }
        console.log('[TUMBLR]', arguments);
      }
    },
    start() {
      this.listenTo(Tumblr.Fox.Events, 'all', ::this.log);
      this.listenTo(Tumblr.Events, 'all', ::this.log);
    },
    stop() {
      this.stopListening();
    }
  });

  Tumblr.Fox.register('EventsListener', EventsListener);

});
