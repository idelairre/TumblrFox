module.exports = (function eventsListener(Tumblr, Backbone, _) {
  const { assign, extend, pick } = _;

  const EventsListener = function() {
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
    this.listenTo(Tumblr.Fox, 'fox:constants:initialized', ::this.initialize);
  };

  extend(EventsListener.prototype, Backbone.Events, {
    initialize(constants, options) {
      this.options = options;
      if (this.options.get('logging')) {
        this.start();
        this.trigger(Tumblr.Fox.Events, 'fox:constants:initialized', {
          constants,
          options: options.toJSON()
        });
      }
      this.stopListening(Tumblr.Fox, 'fox:constants:initialized');
    },
    log(e) {
      if (this.options.get('logging')) {
        if (!this.ignore.includes(e)) {
          if (e.includes('fox')) {
            console.log('%c[TUMBLRFOX] %o', 'color:orange; font-size: 9pt', arguments);
            return;
          }
          console.log('[TUMBLR]', arguments);
        }
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
