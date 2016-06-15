/* global Blob:true */
/* global chrome:true */
/* global document:true */
/* global FileReader:true */
/* global URL:true */
/* eslint no-undef: "error" */

import $ from 'jquery';
import Backbone from 'backbone';
import { camelCase, capitalize } from 'lodash';
import Authentication from './authentication/authentication';
import Buttons from './buttons/buttons';
import Cache from './cache/cache';
import Debug from './debug/debug';
import Experimental from './experimental/experimental';
import ProgressBar from './progressBar/progressBar';
import Settings from './settings/settings';
import View from './view/view';
import bindListeners from './events';
import Modal from './modal/modal';
import './tipped.less';
import './options.less';

// (() => {
//   const log = console.log;
//   console.log = function () {
//     const message = Array.prototype.slice.call(arguments);
//     log.apply(this, Array.prototype.slice.call(arguments));
//     const port = chrome.runtime.connect({
//       name: 'options'
//     });
//     port.postMessage({
//       type: 'log',
//       payload: message.join(' ')
//     })
//   }
// })();

const Options = Backbone.View.extend({
  defaults: {
    initialized: false
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
    this.initialized = false;
    this.props = new Backbone.Model();
    this.bindEvents();
    this.initializePort();
  },
  initializePort() {
    this.port = chrome.runtime.connect({
      name: 'options'
    });
    if (this.port) {
      this.port.onMessage.addListener(bindListeners);
      this.postMessage({ type: 'fetchConstants' });
    }
    console.log('modal initialized');
  },
  renderSubviews() {
    this._subviews = Array.prototype.slice.call(this.$('[data-subview]'));
    this._subviews.map(el => {
      const subviewName = $(el).data('subview');
      const subview = new this.subviews[subviewName].constructor();
      const view = new subview.constructor(this.props.attributes);
      view.render();
      this.$(`[data-subview="${subviewName}"]`).replaceWith(view.$el);
      return view;
    });
    this.initialized = true;
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'REPLY_CONSTANTS', ::this.restoreOptions);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', ::this.setProps);
    this.listenTo(Backbone.Events, 'CACHE_LIKES', ::this.postMessage);
    this.listenTo(Backbone.Events, 'CACHE_FOLLOWING', ::this.postMessage);
    this.listenTo(Backbone.Events, 'DOWNLOAD_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'RESTORE_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'RESET_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'SAVE_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'ERROR', ::this.showError);
    this.listenTo(Backbone.Events, 'DONE', ::this.showDone);
  },
  showError(response) {
    this.$errorModal = new Modal({
      parent: $('.container'),
      header: `${capitalize(response.type)}`,
      message: `${response.payload.message}`
    });
    this.$errorModal.render();
    this.$el.append(this.$errorModal.$el);
  },
  showDone(response) {
    this.$doneModal = new Modal({
      parent: $('.container'),
      header: 'Done',
      message: `${response.message}`
    });
    Backbone.Events.trigger('CHANGE_PROPS', response.payload.constants);
    this.$doneModal.render();
    this.$el.append(this.$doneModal.$el);
  },
  setCacheLikesButton() {
    this.$('button#cacheLikes').prop('disabled', !this.props.get('canFetchApiLikes') && !this.props.get('clientCaching'));
  },
  setProps(newProps) {
    this.postMessage({
      type: 'updateSettings',
      payload: newProps
    });
  },
  postMessage(slug) { // signature: action: {String}, payload: {Object}
    this.port.postMessage(slug);
  },
  restoreOptions(response) {
    const { payload } = response;
    this.props.set(payload);
    if (!this.initialized) {
      this.renderSubviews();
    }
  }
});

new Options({
  el: $('.container')
});
