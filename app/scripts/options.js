import ProgressBar from 'progressbar.js';
import Backbone from 'backbone';
import { camelCase } from 'lodash';
import $ from 'jquery';

const progress = $('#container');
const bar = new ProgressBar.Line(container, {
    strokeWidth: 4,
    easing: 'easeInOut',
    duration: 1400,
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: {
      width: '100%',
      height: '100%'
    },
    text: {
      style: {
        color: '#999',
        position: 'absolute',
        right: '0',
        top: '30px',
        padding: 0,
        margin: 0,
        transform: null
      },
      autoStyleContainer: false
    },
    from: {
      color: '#FFEA82'
    },
    to: {
      color: '#ED6A5A'
    },
    step: (state, bar) => {
      bar.setText(`${Math.round(bar.value() * 100)}%`);
    }
});

const Options = Backbone.View.extend({
  initialize() {
    this.$status = this.$('#status');
    this.props = {};
    this.$bar = bar;
    this.$progress = progress;
    this.$tooltip = this.$('i.note');
    this.restoreOptions();
    this.port = chrome.runtime.connect({
      name: 'options'
    });
    this.port.onMessage.addListener(::this.animateProgress);
  },
  events: {
    'mouseover h1.cache-header': 'showTooltip',
    'mouseout h1.cache-header': 'hideTooltip',
    'click #save': 'saveOptions',
    'click #cacheFollowing': 'cacheFollowing',
    'click #cacheTags': 'cacheTags',
    'click #cacheLikes': 'cacheLikes',
    'click #resetCache': 'resetCache',
    'click #logging': 'toggleLogging'
  },
  toggleLogging(e) {
    const logging = $(e.target).prop('checked');
    chrome.storage.local.set({ logging });
    this.props.logging = logging;
    if (this.props.logging) {
      this.$('.debug').show();
    } else {
      this.$('.debug').hide();
    }
  },
  showTooltip(e) {
    const position = $(e.target).position();
    this.$tooltip.css({
      top: position.top + 40,
      left: position.left + 30
    });
    this.$tooltip.fadeIn(100);
  },
  hideTooltip() {
    this.$tooltip.fadeOut(100);
  },
  animateProgress(response) {
    let { database, percentComplete, itemsLeft, total } = response;
    if (database.toLowerCase() === 'posts') { // this is to account for a poor naming choice
      database = 'likes';
    }
    this.$(camelCase(`#total${database}`)).text(total);
    this.$(`#${database}`).text(total - itemsLeft);
    this.$('#debug').text(JSON.stringify(response));
    // this.$status.text(`items left: ${itemsLeft}`);
    this.$bar.animate(percentComplete / 100);
    if (itemsLeft === 0) {
      this.$status.text('done');
      this.$progress.hide();
      return;
    }
  },
  saveOptions() {
    const consumerKey = this.$('#consumerKey').val();
    const consumerSecret = this.$('#consumerSecret').val();
    const userName = this.$('#userName').val();
    chrome.storage.sync.set({ consumerKey, consumerSecret, userName }, () => {
      this.$status.text('Options saved.');
      setTimeout(() => {
        this.$status.text('');
      }, 750);
    });
  },
  restoreOptions() {
    const syncSlug = {
      consumerKey: '',
      consumerSecret: '',
      userName: '',
      totalPostsCount: 0,
      totalFollowingCount: 0,
      totalTagsCount: 0
    };
    const storageSlug = {
      cachedPostsCount: 0,
      cachedFollowingCount: 0,
      cachedTagsCount: 0,
      logging: false
    };
    chrome.storage.sync.get(syncSlug, items => {
      this.$('#consumerKey').val(items.consumerKey);
      this.$('#consumerSecret').val(items.consumerSecret);
      this.$('#userName').val(items.userName);
      this.$('#totalLikes').text(items.totalPostsCount);
      this.$('#totalFollowing').text(items.totalFollowingCount);
      this.$('#totalTags').text(items.totalTagsCount);
      this.props = Object.assign(this.props, items);
    });
    chrome.storage.local.get(storageSlug, items => {
      this.$('#following').text(items.cachedFollowingCount);
      this.$('#likes').text(items.cachedPostsCount);
      this.$('#tags').text(items.cachedTagsCount);
      this.$('#logging').attr('checked', items.logging);
      this.props = Object.assign(this.props, items);
      if (this.props.logging) {
        this.$('.debug').show();
      }
    });
  },
  cacheTags() {
    this.resetBar();
    this.port.postMessage({ type: 'cacheTags'});
  },
  cacheLikes() {
    this.resetBar();
    this.port.postMessage({ type: 'cacheLikes'});
  },
  cacheFollowing() {
    this.resetBar();
    this.$progress.show();
    this.$status.text('');
    this.port.postMessage({ type: 'cacheFollowing'});
  },
  resetCache() {
    this.resetBar();
    this.$status.text('');
    this.$('#following').text(0);
    this.$('#likes').text(0);
    this.$('#tags').text(0);
    this.port.postMessage({ type: 'resetCache' });
  },
  resetBar() {
    this.$bar.set(0);
    this.$progress.show();
    this.$status.text('');
  }
})

const options = new Options({
  el: $('.container')
});
