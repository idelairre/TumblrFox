/* global chrome:true */
/* global document:true */
/* eslint no-undef: "error" */

import $ from 'jquery';
import Backbone, { Model, View } from 'backbone';
import capitalize from '../utils/capitalize';
import camelCase from '../utils/camelCase';
import constants from '../constants';
import Authentication from './authentication/authentication';
import Buttons from './buttons/buttons';
import Cache from './cache/cache';
import Debug from './debug/debug';
import Experimental from './experimental/experimental';
import ProgressBar from './progressBar/progressBar';
import Settings from './settings/settings';
import snakeCase from '../utils/snakeCase';
import Modal from './modal/modal';
import './tipped.less';
import './options.less';

// TODO: see if you can't just import constants and make it act like a backbone model

const Options = View.extend({
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
    if (constants.initialized) { // is this rational? if it doesn't set correctly here and on the constants reply, it sets on ready.
      this.initializeConstants();
    } else {
      constants.once('ready', ::this.initializeConstants);
    }
    this.bindEvents();
    this.initializePort();
  },
  initializeConstants() {
    this.props = new Model(constants.toJSON());
    this.restoreOptions(this.props.toJSON());
  },
  initializePort() {
    this.port = chrome.runtime.connect({
      name: 'options'
    });
    if (this.port) {
      this.port.onMessage.addListener(response => {
        const eventName = snakeCase(response.type).toUpperCase();
        if (typeof eventName !== 'undefined') {
          Backbone.Events.trigger(eventName, response);
        }
      });
    }
  },
  renderSubviews() {
    this._subviews = Array.from(this.$('[data-subview]'));
    this._subviews = this._subviews.map(el => {
      const subviewName = $(el).data('subview');
      const view = new this.subviews[subviewName].constructor(this.props.attributes);
      view.render();
      this.$(`[data-subview="${subviewName}"]`).replaceWith(view.$el);
      return view;
    });
    this.initialized = true;
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', ::this.updateProps);
    this.listenTo(Backbone.Events, 'CACHE_LIKES', ::this.postMessage);
    this.listenTo(Backbone.Events, 'CACHE_POSTS', ::this.postMessage);
    this.listenTo(Backbone.Events, 'CACHE_FOLLOWING', ::this.postMessage);
    this.listenTo(Backbone.Events, 'DOWNLOAD_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'RESTORE_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'RESET_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'REHASH_TAGS', ::this.postMessage);
    this.listenTo(Backbone.Events, 'EXTENSION_TESTS', ::this.postMessage);
    this.listenTo(Backbone.Events, 'SAVE_CACHE', ::this.postMessage);
    this.listenTo(Backbone.Events, 'ERROR', ::this.showError);
    this.listenTo(Backbone.Events, 'DONE', ::this.showDone);
  },
  updateProps(newProps) {
    this.props.set(newProps);
    const changed = this.props.changedAttributes();
    this._subviews.forEach(subview => {
      Object.keys(changed).forEach(key => {
        if ({}.hasOwnProperty.call(subview, 'props')) {
          if ({}.hasOwnProperty.call(subview.props.attributes, key)) {
            subview.props.set(key, changed[key]);
          }
        }
      });
    });
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
