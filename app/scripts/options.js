import ProgressBar from 'progressbar.js';
import Backbone from 'backbone';
import { camelCase } from 'lodash';
import $ from 'jquery';
import Tipped from './lib/tipped';
import '../styles/tipped.less';

const clientCachingTooltip = {
  template: `
  <div class="note tooltip" style="position: absolute" data-tooltip="clientCaching">
    * Toggles experimental caching through client rather than api.
    <li>Advantages: faster post rendering, actual Tumblr html instead of reconstituted html via jquery, native/predictable Tumblr behavior, you don't have to reveal your likes to other users.</li>
    <li>Drawbacks: significantly slower cache time than fetching from the API.</li>
  </div>`
};

const cachingTooltip = {
  template: `<i class="note tooltip" style="position: absolute" data-tooltip="caching">* some posts and blogs you are following may have been deleted, it is sometimes not possible to fetch 100% of your likes or followed blogs.</i>`,
};


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
  defaults: {
    props: {
      cachedPostsCount: 0,
      cachedFollowingCount: 0,
      cachedTagsCount: 0,
    }
  },
  initialize() {
    this.$status = this.$('#status');
    this.props = new Backbone.Model();
    this.$bar = bar;
    this.$progress = progress;
    Tipped.create('[data-tooltip-key="clientCaching"]', $(clientCachingTooltip.template).html(), { skin: 'light', position: 'topleft' });
    Tipped.create('[data-tooltip-key="caching"]', $(cachingTooltip.template).html(), { skin: 'light', position: 'topleft' });
    this.bindEvents();
    this.initializePort();

    console.log('[tooltips]', Tipped);
  },
  initializePort() {
    this.port = chrome.runtime.connect({
      name: 'options'
    });
    this.port.onMessage.addListener(response => {
      if (response.message === 'initialized') {
        this.restoreOptions(response.payload);
        this.afterInitialize();
      }
    });
  },
  afterInitialize() {
    this.port.onMessage.addListener(::this.animateProgress);
    this.$('buttons').prop('disabled', false);
  },
  events: {
    'click #save': 'saveOptions',
    'click #cacheFollowing': 'cacheFollowing',
    'click #cacheTags': 'cacheTags',
    'click #cacheLikes': 'cacheLikes',
    'click #clientCaching': 'toggleClientCaching',
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
    this.listenTo(this.props, 'change:canGetApiLikes', model => {
      if (model.get('canGetApiLikes')) {
        this.$('button#cacheLikes').prop('disabled', false);
      } else if (!model.get('canGetApiLikes') && !model.get('clientCaching')) {
        this.$('button#cacheLikes').prop('disabled', true);
      }
    });
  },
  setProps(model) {
    console.log(this.props);
    for (const key in model.changed) {
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
  toggleClientCaching(e) {
    const clientCaching = e.target.checked;
    chrome.storage.local.set({ clientCaching });
    this.props.set('clientCaching', clientCaching);
    console.log('[TOGGLE CLIENT CACHING]', this.props.get('clientCaching'));
  },
  toggleDebug(e) {
    const debug = e.target.checked;
    chrome.storage.local.set({ debug });
    this.props.set('debug', debug);
    console.log('[TOGGLE DEBUG]', this.props.get('debug'));
  },
  toggleKeys(e) {
    const defaultKeys = e.target.checked;
    chrome.storage.local.set({ defaultKeys });
    this.props.set('defaultKeys', defaultKeys);
  },
  animateProgress(response) {
    let { database, percentComplete, itemsLeft, total } = response;
    const totalKey = camelCase(`total-${database}-count`);
    const cachedKey = camelCase(`cached-${database}-count`);
    const section = $(`.${database}`).children();
    section.last().text(total);
    this.$('#debugConsole').text(JSON.stringify(response));
    // this.$status.text(`items left: ${itemsLeft}`);
    this.$bar.animate(percentComplete / 100);
    this.props.set(`${cachedKey}`, total - itemsLeft);
    if (this.props.get(`${totalKey}`) === 0) {
      this.props.set(`${totalKey}`, total);
    }
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
    this.port.postMessage({
      type: 'updateSettings',
      payload: this.props.attributes
    });
  },
  restoreOptions(constants) {
    setTimeout(() => {
      this.props.set(constants);
      $.ajax({
        type: 'GET',
        url: `https://www.tumblr.com/liked/by/${this.props.get('userName')}`,
        success: () => {
          this.props.set('canGetApiLikes', true);
        },
        error: error => {
          this.props.set('canGetApiLikes', false);
        }
      });
    }, 1);
  },
  cacheTags() {
    this.resetBar();
    this.port.postMessage({
      type: 'cacheTags'
    });
  },
  cacheLikes() {
    this.resetBar();
    this.port.postMessage({
      type: 'cacheLikes',
      clientCaching: this.props.get('clientCaching')
    });
  },
  cacheFollowing() {
    this.resetBar();
    this.$progress.show();
    this.$status.text('');
    this.port.postMessage({
      type: 'cacheFollowing'
    });
  },
  resetCache() {
    this.resetBar();
    this.$status.text('');
    this.port.postMessage({ type: 'resetCache' });
    this.props.set(this.defaults.props);
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
