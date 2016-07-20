import Events from '../application/events';
import Listener from './listener';
import { pick } from 'lodash';

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
  },
  log(e) {
    if (!this.ignore.includes(e)) {
      if (e.includes('fox')) {
        console.log('%c[TUMBLRFOX] %o', 'color:#81562C; font-size: 9pt', arguments);
      } else if (e.includes('chrome')) {
        console.log('%c[TUMBLRFOX EXTENSION] %o', 'color:#81562C; font-size: 9pt', arguments);
      } else {
        console.log('[TUMBLR]', arguments);
      }
    }
  },
  start() {
    this.listenTo(Events, 'all', ::this.log);
    this.listenTo(Tumblr.Events, 'all', ::this.log);
  },
  stop() {
    this.stopListening();
  }
});

module.exports = new EventsListener();
