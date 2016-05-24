/* global Blob:true */
/* global chrome:true */
/* global document:true */
/* global FileReader:true */
/* global URL:true */
/* eslint no-undef: "error" */

import $ from 'jquery';
import Backbone from 'backbone';
import { camelCase } from 'lodash';
import Authentication from './authentication/authentication';
import Buttons from './buttons/buttons';
import Cache from './cache/cache';
import Debug from './debug/debug';
import Experimental from './experimental/experimental';
import ProgressBar from './progressBar/progressBar';
import Settings from './settings/settings';
import optionsActions from './optionsActions';
import '../../../styles/tipped.less';
import '../../../styles/options.less';

const Options = Backbone.View.extend({
  defaults: {
    props: {
      cachedPostsCount: 0,
      cachedFollowingCount: 0,
      cachedTagsCount: 0
    }
  },
  subviews: {
    authentication: {
      constructor: Authentication
    },
    buttons: {
      constructor: Buttons
    },
    cache: {
      constructor: Cache
    },
    debug: {
      constructor: Debug
    },
    experimental: {
      constructor: Experimental
    },
    progressBar: {
      constructor: ProgressBar
    },
    settings: {
      constructor: Settings
    }
  },
  initialize() {
    this.initialized = !1;
    this.rendered = !0;
    this.$debug = this.$('#debugConsole');
    this.$download = $('a#cache');
    this.props = new Backbone.Model();
    this.bindEvents();
    this.initializePort();
    this.renderSubviews();
  },
  initializePort() {
    this.port = chrome.runtime.connect({ name: 'options' });
    this.port.postMessage({ action: 'fetchConstants' });
    this.port.onMessage.addListener(optionsActions);
  },
  renderSubviews() {
    this._subviews = Array.prototype.slice.call(this.$('[data-subview]'));
    this._subviews.map(el => {
      const subviewName = $(el).data('subview');
      const subview = new this.subviews[subviewName].constructor();
      const view = new subview.constructor(this.props);
      view.render();
      this.$(`[data-subview="${subviewName}"]`).replaceWith(view.$el);
      return view;
    });
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', ::this.restoreOptions);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', ::this.setProps);
    this.listenTo(Backbone.Events, 'CACHE_LIKES', ::this.postMessage);
    this.listenTo(Backbone.Events, 'CACHE_FOLLOWING', ::this.postMessage);
    this.listenTo(Backbone.Events, 'DOWNLOAD_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'RESTORE_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'RESET_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'SAVE_CACHE', ::this.postMessage);
  },
  setCacheLikesButton() {
    this.$('button#cacheLikes').prop('disabled', !this.props.get('canFetchApiLikes') && !this.props.get('clientCaching'));
  },
  setProps(newProps) {
    this.props.set(newProps);
    this.postMessage({
      action: 'updateSettings',
      payload: this.props.attributes
    });
  },
  postMessage(slug) { // signature: action: {String}, payload: {Object}
    this.port.postMessage(slug);
  },
  restoreOptions(response) {
    const { payload } = response;
    console.log(payload);
    this.props.set(payload);
  }
});

new Options({
  el: $('.container')
});
