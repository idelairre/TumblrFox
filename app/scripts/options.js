import ProgressBar from 'progressbar.js';
import Backbone from 'backbone';
import { camelCase } from 'lodash';
import $ from 'jquery';
import constants from './constants';

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
    this.props = new Backbone.Model();
    this.$bar = bar;
    this.$progress = progress;
    this.$tooltip = this.$('i.note');
    this.bindEvents();
    this.initializePort();
  },
  initializePort() {
    this.port = chrome.runtime.connect({
      name: 'options'
    });
    this.port.onMessage.addListener(message => {
      if (message === 'initialized') {
        this.afterInitialize();
      }
    });
    this.restoreOptions();
  },
  afterInitialize() {
    $('button').prop('disabled', false);
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
    'click #debug': 'toggleDebug',
    'click #defaultKeys': 'toggleKeys',
    'click #setUser': 'setUser'
  },
  bindEvents() {
    this.listenTo(this.props, 'change', ::this.setProps);
    this.listenTo(this.props, 'change:defaultKeys', model => {
      if (model.get('defaultKeys')) {
        this.$('.consumer-secret').hide();
        this.$('.consumer-key').hide();
      } else {
        this.$('.consumer-secret').show();
        this.$('.consumer-key').show();
      }
    });
    this.listenTo(this.props, 'change:setUser', model => {
      if (model.get('setUser')) {
        this.$('.user').show();
      } else {
        this.$('.user').hide();
      }
    });
    this.listenTo(this.props, 'change:debug', model => {
      if (model.get('debug')) {
        this.$('section.debug').show();
      } else {
        this.$('section.debug').hide();
      }
    });
  },
  setProps(model) {
    for (const key in this.props.attributes) {
      const keyElem = this.$(`#${key}`);
      const tag = keyElem.prop('tagName');
      if (tag === 'INPUT' && keyElem.attr('type') === 'text') {
        keyElem.val(this.props.get(key));
      } else if (tag === 'INPUT' && keyElem.attr('type') === 'checkbox') {
        keyElem.attr('checked', this.props.get(key));
      } else if (tag === 'SPAN') {
        keyElem.text(this.props.get(key));
      }
    }
    this.setAuthDivState();
  },
  setAuthDivState() {
    if (!this.props.get('setUser') && this.props.get('defaultKeys')) {
      this.$('.authentication').hide();
    }
    if (!this.props.get('defaultKeys') || this.props.get('setUser')) {
      this.$('.authentication').show();
    }
  },
  setUser(e) {
    const setUser = $(e.target).prop('checked');
    this.props.set('setUser', setUser);
    chrome.storage.local.set({ setUser });
  },
  toggleDebug(e) {
    const debug = e.target.checked;
    chrome.storage.local.set({ debug });
    this.props.set('debug', debug);
    console.log('[TOGGLE DEBUG]', this.props.get('debug', debug));
  },
  toggleKeys(e) {
    const defaultKeys = e.target.checked;
    chrome.storage.local.set({ defaultKeys });
    this.props.set('defaultKeys', defaultKeys);
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
    const totalKey = camelCase(`total${database}`);
    const section = $(`.${database}`).children();
    section.last().text(total);
    section.first().text(total - itemsLeft);
    this.$('#debugConsole').text(JSON.stringify(response));
    // this.$status.text(`items left: ${itemsLeft}`);
    this.$bar.animate(percentComplete / 100);
    if (itemsLeft === 0) {
      this.$status.text('done');
      this.$progress.hide();
      this.$('buttons').prop('disabled', false);
      return;
    }
  },
  saveOptions() {
    console.log(this.props);
    const consumerKey = this.$('#consumerKey').val();
    const consumerSecret = this.$('#consumerSecret').val();
    const userName = this.$('#userName').val();
    const syncSlug = {
      consumerKey: consumerKey !== '' ? consumerKey : this.props.get('consumerKey'),
      consumerSecret: consumerSecret !== '' ? consumerSecret : this.props.get('consumerSecret'),
      userName: userName !== '' ? userName : this.props.get('userName')
    };
    chrome.storage.sync.set(syncSlug, () => {
      this.$status.text('Options saved.');
      setTimeout(() => {
        this.$status.text('');
      }, 750);
    });
    this.port.postMessage({ type: 'updateSettings', payload: this.props.attributes });
  },
  restoreOptions() {
    setTimeout(() => {
      console.log(constants);
      this.props.set(constants);
    }, 1);
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
    this.$('#cachedFollowing').text(0);
    this.$('#cachedLikes').text(0);
    this.$('#cachedTags').text(0);
    this.$('#totalFollowing').text(0);
    this.$('#totalLikes').text(0);
    this.$('#totalTags').text(0);
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
