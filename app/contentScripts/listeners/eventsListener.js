module.exports = (function eventsListener(Tumblr, Backbone, _) {
  const { assign, extend, pick } = _;

  const EventsListener = function(options) {
    assign(this, pick(options, ['events', 'options']));
    this.ignore = [
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
      'fox:updateTags',
      'DOMEventor:flatscroll'
    ];
    this.getDependencies();
  };

  extend(EventsListener.prototype, Tumblr.Events, Backbone.Events);

  extend(EventsListener.prototype, {
    getDependencies() {
      this.listenTo(Tumblr.Events, 'fox:constants:initialized', ::this.initialize);
    },
    initialize(constants, options) {
      this.options = options;
      if (this.options.get('logging')) {
        this.start();
        this.stopListening(Tumblr.Events, 'fox:constants:initialized');
      }
    },
    log(e) {
      if (this.options.get('logging')) {
        if (!this.ignore.includes(e)) {
          if (e.includes('fox')) {
            console.log('%c[TUMBLRFOX] %o', 'color:orange; font-size: 9pt', arguments);
            return;
          }
          console.log('[LOG]', arguments);
        }
      }
    },
    start() {
      this.listenTo(this.events, 'all', ::this.log);
    },
    stop() {
      this.stopListening(this.events, 'all', ::this.log);
    }
  });

  Tumblr.Fox.register('EventsListener', EventsListener);
});
