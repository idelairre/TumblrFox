/* global chrome:true */
/* global document:true */
/* eslint no-undef: "error" */

import $ from 'jquery';
import { Events, Model, View } from 'backbone';
import { has, capitalize, camelCase, snakeCase } from 'lodash';
import constants from '../constants';
import Authentication from './authentication/authentication';
import Buttons from './buttons/buttons';
import Cache from './cache/cache';
import Debug from './debug/debug';
import Experimental from './experimental/experimental';
import ProgressBar from './progressBar/progressBar';
import Settings from './settings/settings';
import Modal from './modal/modal';
import './tipped.less';
import './options.less';

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
    this.initializeViews();
    this.bindEvents();
    this.initializePort();
  },
  initializeViews() {
    this.props = this.model;
    if (!this.initialized) {
      this.renderSubviews();
    }
    this.initialized = true;
  },
  initializePort() {
    this.port = chrome.runtime.connect({
      name: 'options'
    });
    this.initializeListeners();
  },
  initializeListeners() {
    if (this.port) {
      this.port.onMessage.addListener(response => {
        const eventName = snakeCase(response.type).toUpperCase();
        if (typeof eventName !== 'undefined') {
          Events.trigger(eventName, response);
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
  },
  bindEvents() {
    this.listenTo(Events, 'CHANGE_PROPS', ::this.updateProps);
    this.listenTo(Events, 'CACHE_LIKES', ::this.postMessage);
    this.listenTo(Events, 'CACHE_POSTS', ::this.postMessage);
    this.listenTo(Events, 'CACHE_FOLLOWING', ::this.postMessage);
    this.listenTo(Events, 'DOWNLOAD_CACHE', ::this.postMessage);
    this.listenTo(Events, 'RESTORE_CACHE', ::this.postMessage);
    this.listenTo(Events, 'RESET_CACHE', ::this.postMessage);
    this.listenTo(Events, 'REHASH_TAGS', ::this.postMessage);
    this.listenTo(Events, 'EXTENSION_TESTS', ::this.postMessage);
    this.listenTo(Events, 'SAVE_CACHE', ::this.postMessage);
    this.listenTo(Events, 'ERROR', ::this.showError);
    this.listenTo(Events, 'DONE', ::this.showDone);
  },
  updateProps(newProps) {
    this.props.set(newProps);
    const changed = this.props.changedAttributes();
    this._subviews.forEach(subview => {
      Object.keys(changed).forEach(key => {
        if (has(subview, 'props')) {
          if (has(subview.props.attributes, key)) {
            subview.props.set(key, changed[key]);
          }
        }
      });
    });
    constants.set(changed);
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
    Events.trigger('CHANGE_PROPS', response.payload.constants);
    this.$doneModal.render();
    this.$el.append(this.$doneModal.$el);
  },
  setCacheLikesButton() {
    this.$('button#cacheLikes').prop('disabled', !this.props.get('canFetchApiLikes') && !this.props.get('clientCaching'));
  },
  postMessage(slug) { // signature: action: {String}, payload: {Object}
    if (this.port) {
      this.port.postMessage(slug);
    }
  },
  restoreOptions(constants) {
    if (!this.initialized) {
      this.renderSubviews();
    }
    this.initialized = true;
  },
  remove() {
    this.stopListening(Events);
    this._subviews.forEach(subview => subview.remove());
    this._subviews = [];
    return View.prototype.remove.apply(this, arguments);
  }
});

window.App = {
  Components: {
    Authentication,
    Buttons,
    Cache,
    Debug,
    Experimental,
    ProgressBar,
    Settings,
    Options
  }
};

const renderOptions = () => {
  window.App.options = new Options({
    el: $('.container'),
    model: new Model(constants.toJSON())
  });
}

if (constants.initialized()) {
  renderOptions();
} else {
  constants.once('initialized', renderOptions);
}

export default Options;
