import $ from 'jquery';
import { Model } from 'backbone';
import { extend, forIn, isEmpty, uniqueId } from 'lodash';
import * as Components from './components/components';
import * as Models from './models/models';
import ActionListener from './listeners/actionListener';
import AppState from './application/state';
import BlogSource from './source/blogSource';
import ChromeListener from './listeners/chromeListener';
import ChromeMixin from './components/mixins/chromeMixin';
import ComponentFetcher from './utils/componentFetcherUtil';
import constants from './application/constants';
import DashboardSource from './source/dashboardSource';
import ExtendedPopoverMixin from './components/mixins/extendedPopoverMixin';
import EventsListener from './listeners/eventsListener';
import Events from './application/events';
import FollowingSource from './source/followingSource';
import LikeSource from './source/likeSource';
import LoaderMixin from './components/mixins/loaderMixin';
import Thoth from './utils/idleMonitorUtil';
import Utils from './utils';
import 'backbone.radio';

const App = function () {
  this.constants = constants;

  this.options = new Model({
    firstRun: false,
    initialized: false,
    idle: false,
    polling: false,
    pollingInterval: 200000,
    rendered: false,
    test: false,
    cachedTags: false,
    cachedLikes: false,
    cachedFollowing: false,
    enableTextSearch: false
  });

  this.state = AppState;

  const optionsChannel = Backbone.Radio.channel('options');

  optionsChannel.reply('fox:getOptions', this.options.toJSON());

  this._initializers = {};
  this._intervalTasks = {};
};

extend(App.prototype, ChromeMixin.properties, {
  loadComponents() {
    this.Application = {};
    this.Components = Components;
    this.Events = Events;
    this.Listeners = {
      ActionListener,
      ChromeListener,
      EventsListener
    };
    this.Mixins = {
      ChromeMixin,
      ExtendedPopoverMixin,
      LoaderMixin
    };
    this.Models = Models;
    this.Source = {
      BlogSource,
      DashboardSource,
      FollowingSource,
      LikeSource
    };
    this.Utils = Utils;

    this.componentFetcher = ComponentFetcher;
    this.Thoth = Thoth;
  },
  start() {
    this.loadComponents();
    this.initializeConstants();
    this.bindListeners();
    if (!this.constants.clientTests) {
      this.startHeartBeat();
      this.initializeThoth();
      this.initializeIntervalTasks();
    }
    this.trigger('initialized');
  },
  startHeartBeat(interval) {
    if (this.options.get('polling')) {
      return;
    }
    if (typeof interval === 'undefined') {
      interval = this.options.get('pollingInterval') || 20000;
    }
    this.Events.trigger('fox:heartbeat:started');
    this.options.set('polling', true);
    this.heartbeat = setInterval(() => {
      this.trigger('heartbeat');
      if (this.options.get('logging')) {
        console.log('%c[TUMBLRFOX] ♥', 'color:#81562C');
      }
    }, interval);
  },
  onHeartbeat(name, func) {
    this._intervalTasks[name] = func.bind(this);
  },
  stopHeartbeat() {
    if (this.options.get('polling')) {
      clearInterval(this.heartbeat);
      this.Events.trigger('fox:heartbeat:stopped');
      this.options.set('polling', false);
    }
  },
  bindListeners() {
    if (this.options.get('logging')) {
      this.Listeners.EventsListener.start();
    }
  },
  unbindListeners() {
    this.stopListening();
  },
  addInitializer(e, callback) {
    const eventId = uniqueId(e);
    this._initializers[eventId] = {
      called: false,
      callback
    };
    this.once(e, response => {
      if (response) {
        callback.call(this, response);
      } else {
        callback.call(this);
      }
      this._initializers[eventId].called = true;
      if (this._checkInitializers() || isEmpty(this.initializers)) {
        delete this._initializers;
      }
    });
  },
  initializeIntervalTasks() {
    this.on('heartbeat', () => {
      Object.keys(this._intervalTasks).map(func => {
        this._intervalTasks[func]();
      });
    });
  },
  _checkInitializers() {
    let initialized = true;
    forIn(this._initializers, initializer => {
      if (!initializer.called) {
        initialized = false;
        return initialized;
      }
    });
    return initialized;
  },
  initializeConstants() {
    if (Tumblr.Prima.currentUser()) {
      this.updateConstants({
        currentUser: Tumblr.Prima.currentUser().toJSON(),
        formKey: this.constants.formKey
      });
    }
    this._initializeConstants();
  },
  _initializeConstants() { // TODO: change these to their corresponding constants value
    this.options.set('logging', this.constants.debug);
    this.options.set('cachedTags', (this.constants.cachedTagsCount !== 0));
    this.options.set('cachedUserPosts', (this.constants.cachedPostsCount >= constants.totalPostsCount));
    this.options.set('cachedUserPosts', (this.constants.cachedLikesCount !== 0));
    this.options.set('cachedFollowing', (this.constants.cachedFollowingCount !== 0));
    this.options.set('firstRun', this.constants.firstRun);
    this.options.set('version', this.constants.version);
    this.options.set('test', this.constants.clientTests);
    this.trigger('initialized:constants');
  },
  updateConstants(payload) {
    this.chromeTrigger('chrome:initialize:constants', payload);
  },
  initializeThoth() {
    if (!this.constants.enableIdleMonitor) {
      return;
    }
    const events = {
      checkIntervalSecs: 10,
      events: {
        document: 'mousemove'
      },
      warningSecs: 1,
      timeoutSecs: 10
    };
    this.idleMonitor = new Tumblr.Fox.Thoth(events);
    this.idleMonitor.start();

    this.idleMonitor.on('action', () => {
      if (this.options.get('idle')) {
        this.options.set('idle', false);
        this.startHeartBeat();
      }
    });

    this.idleMonitor.on('timeout', () => {
      this.options.set('idle', true);
      this.stopHeartbeat();
    });
  },
  onInitialized(callback) {
    this.once('initialized', () => {
      callback.call(this);
    });
  }
}, Backbone.Events);

module.exports = new App();
