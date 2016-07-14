module.exports = (function app(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, extend, camelCase, clone, forIn, invert, keys, last, mapKeys, omit, pick, result, uniqueId } = _;
  const { currentUser } = Tumblr.Prima;
  const { Tumblelog } = Tumblr.Prima.Models;
  const listItems = $('#posts').find('li');
  const attachNode = $(listItems[listItems.length - 1]);
  const formKey = $('#tumblr_form_key').attr('content');
  const icon = 'iVBORw0KGgoAAAANSUhEUgAAAGcAAABpCAYAAAAnSz2JAAACkklEQVR42u3c0U3DMBDGcW/BGKzBGIzBGozRNToGY6C+RElkGtEHqIJoEvv8ne9/z0jE3+/OTZM0KVG+Kt+KJGwz34Qzz/OJ2MSGIf8oorOB2YUDUL267kznwzgA1Z+aQzgA1YU5jANQPZgiONd98p14y8MUwWF66sAUwwFo15nZhxkOQGWnpjgOQMm+2fPGIn7DRt+KwzU4wybPOwoKowzzzoLEIL98oKARxokOVD23XKCAEcaJdgZn1tC5UAEjjBMByDyrXLjAEcb56x9nRyXTxFYL9Ixj1QBmOGtncMCI4Hjc3lpnYx6WFyCFXJoEpQ50f2yXy+UpDM7awTxyn92i1p4watWwTTtYcXpUmrU5jtoZnFKjJoW9X+XzRzEHyWBad22Lzz9ZnJZAyg2aIu/5rc7MXOK0/lautG5JnGEYnltcaFRryqT6Td363onqmmUvo1jdq1der6trXDUePwJHoNOVzsy6wSkF5K0J3eCM4/hy5Dg9NqAbnCOfF57X5/q28X/H631t7h5ZevSY7/9mmqZX9zgegVbOzN56aLougbqGud3TOCkv6LpNffa6TacIC+sWxvsC1Y977btbCCCVx6yqTo1XoFAwnhYdEmapZZ/MlB6Mx9/VhIIBSBwGIAc4AAnDACQOA5A4DDjCMACJwwD0XfIvRWdqAr0TBhiA4sDc7qmcgWF6gAHody1v9Ug9FFMDEDDRgVKvpf68clgY79OTohQwAJW6mHlOEYupAQiYvWXx/kxgOpoeRESBkBAFKvabGYCYmjBApC4KRNqiOCQtCkTCwkCkKwpEqqJApCkKRIqiOCQoCkRyokDL61ZITRSItESBSEkUiHQa1/LGQmAcTQ+JiALJ/2iWoqiK9QXVEo0oBz0DhAAAAABJRU5ErkJggg==';

  window.$ = $;

  window.webpackJsonp(0, [function (module, exports, require) {
    window.webpackModules = Array.prototype.slice.call(arguments);
    window.require = require;
  }]);

  Backbone.history.stop(); // NOTE: stop history so that TumblrFox router can take over

  const Router = Backbone.Router.extend({
    constructor(options) {
      this.options = options || {};
      assign(this, this.options);
      Backbone.Router.apply(this, arguments);
      const appRoutes = this.options.appRoutes;
      const controller = this._getController();
      this.processAppRoutes(controller, appRoutes);
      this.on('route', this._processOnRoute, this);
    },
    appRoute(route, methodName) {
      const controller = this._getController();
      this.addAppRoute(controller, route, methodName);
    },
    _processOnRoute(routeName, routeArgs) {
      if (typeof this.onRoute === 'function') {
        const routePath = invert(this.options.appRoutes)[routeName];
        this.onRoute(routeName, routePath, routeArgs);
      }
    },
    processAppRoutes(controller, appRoutes) {
      if (!appRoutes) {
        return;
      }
      const routeNames = keys(appRoutes).reverse();
      routeNames.map(route => {
        this.addAppRoute(controller, route, appRoutes[route]);
      });
    },
    _getController() {
      return this.options.controller;
    },
    addAppRoute(controller, route, methodName) {
      const method = controller[methodName];
      if (!method) {
        throw new Error(`Method "${methodName}" was not found on the controller`);
      }
      this.route(route, methodName, method.bind(controller));
    }
  });

  const RouteController = function(options) {
    this.options = options || {};
    if (typeof this.initialize === 'function') {
      this.initialize.apply(this.options);
    }
  }

  RouteController.extend = Backbone.Model.extend;

  const State = Model.extend({
    initialize(options) {
      assign(this, options);
    },
    set() {
      Model.prototype.set.apply(this, arguments);
      this.trigger('change:state', this.getState());
    },
    getState() {
      for (const key in this.attributes) {
        if (this.attributes[key]) {
          return key;
        }
      }
    },
    setState(state) {
      const attributes = this.attributes;
      if (!Object.keys(this.attributes).includes(state)) {
        console.error(`Error: "${state}" is not a valid state. Valid states: "${Object.keys(this.attributes)}"`);
        return;
      } else if (this.getState() === state) {
        console.error(`Error: state model is already in state "${state}"`);
        return;
      }
      for (const key in attributes) {
        if (key === state) {
          attributes[key] = true;
        } else {
          attributes[key] = false;
        }
      };
      this.set(attributes);
    }
  });


  const TumblrFox = function () {
    this.require = window.require;

    this.route = window.location.href.split('/');

    this.Application = {};
    this.Class = {};
    this.Events = {}
    this.Components = {};
    this.Listeners = {};
    this.Mixins = {};
    this.Models = {};
    this.Router = Router;
    this.Source = {};
    this.Utils = {};

    this._initializers = {};
    this._intervalTasks = {};

    this.Models['StateModel'] = State;

    extend(this.Events, Backbone.Events);

    this.constants = {
      attachNode,
      rootUrl: 'https://www.tumblr.com/',
      formKey,
      icon
    };

    this.options = new Model({
      firstRun: false,
      initialized: false,
      idle: false,
      polling: false,
      pollingInterval: 200000,
      rendered: false,
      test: false,
      cachedTags: false,
      cachedFollowing: false,
      enableTextSearch: false
    });

    this.state = new State({
      dashboard: true,
      disabled: false,
      user: false,
      likes: false
    });

    this.startHeartBeat = this.startHeartBeat.bind(this, this.options.get('pollingInterval'));
    this.startHeartBeat();
    this.bindListeners();
  };

  extend(TumblrFox.prototype, Backbone.Events, {
    startHeartBeat(interval) {
      if (this.options.get('polling')) {
        return;
      }
      this.Events.trigger('fox:heartbeat:started');
      this.options.set('polling', true);
      this.heartbeat = setInterval(() => {
        this.trigger('heartbeat');
        console.log('%c[TUMBLRFOX] ♥', 'color:#81562C');
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
      this.listenTo(this, 'initialize:components:add', ::this.emitDependency);
      this.listenTo(this, 'initialize:components:done', ::this.unbindListeners);
      this.listenTo(this.Events, 'chrome:response:error', e => {
        const error = e.detail;
        Tumblr.Dialog.alert(error);
      });
    },
    unbindListeners() {
      this.stopListening(this, 'initialize:componentFetcher');
    },
    register(name, component) { // NOTE: we could register these after init and just put them in the component fetcher, that way we could grab components without complex init code
      if (name.includes('Class')) {
        name = name.replace(/Class/, '');
        this.Class[name] = component;
      } else if (name.includes('Model')) {
        this.Models[name] = component;
      } else if (name.includes('Component') || name.includes('Container')) {
        this.Components[name] = component;
        this.initializeComponent(name, component); // NOTE: this is hokey
      } else if (name.includes('Mixin')) {
        this.Mixins[name] = component;
      } else if (name.includes('Listener')) {
        this.Listeners[name] = new component();
      } else if (name.includes('Source')) {
        this.Source[name] = new component();
        this.Utils.ComponentFetcher.put(name, this.Source[name]);
        return;
      }
      this.Utils.ComponentFetcher.put(name, component);
    },
    emitDependency(name, dependency) {
      this.trigger(`initialize:dependency:${camelCase(name)}`, dependency);
    },
    initializeComponent(name, component) {
      const event = `initialize:dependency:${camelCase(name)}`;
      if (component.prototype.hasOwnProperty('startWithParent') && component.prototype.hasOwnProperty('name') && !this._initializers[event]) {
        this.once(event, Component => {
          this.Application[component.prototype.name] = new Component({
            state: this.state,
            options: this.options
          });
        });
      }
    },
    getComponents(components) {
      this.once('initialize:componentFetcher', ComponentFetcher => {
        ComponentFetcher.getComponents(components);
        this.get = ComponentFetcher.get.bind(ComponentFetcher);
        this.put = ComponentFetcher.put.bind(ComponentFetcher);
        extend(Backbone.Model, ComponentFetcher.get('TumblrModel'));
        ComponentFetcher.put('StateModel', State);
      });
    },
    addInitializer(event, callback) {
      const eventId = uniqueId(event);
      this._initializers[eventId] = {
        called: false,
        callback
      };
      this.once(event, component => {
        callback.call(Tumblr.Fox, component);
        this._initializers[eventId].called = true;
        if (this._checkInitializers()) {
          this.trigger('initialized');
          this.off();
          this.on('heartbeat', () => {
            Object.keys(this._intervalTasks).map(func => {
              this._intervalTasks[func]();
            });
          });
          delete this._initializers;
          console.log('[TUMBLRFOX INITIALIZED]');
        }
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
    fetchConstants() {
      this.chromeTrigger('chrome:fetch:constants', response => {
        this.trigger('initialize:constants', response);
      });
    },
    updateConstants(payload) {
      this.chromeTrigger('chrome:initialize:constants', payload);
    },
    onInitialized(callback) {
      this.once('initialized', () => {
        callback.call(this);
      });
    }
  });

  Tumblr.Fox = new TumblrFox();

  Tumblr.Fox.RouteController = RouteController.extend({
    onDashboard() {
      if (Tumblr.Fox.options.get('test')) {
        const TestComponent = Tumblr.Fox.get('TestComponent');
        Tumblr.Fox.Application.test = new TestComponent();
      }
      const FollowingModel = Tumblr.Fox.get('FollowingModel');
      Tumblr.Fox.Application.following = new FollowingModel({
        offset: 0,
        limit: 100
      });
      Tumblr.Fox.Application.following.fetchAll();
    },
    onFollowing() {
      const FollowerList = Tumblr.Fox.get('FollowerListComponent');
      Tumblr.Fox.Application.following = new FollowerList();
      Tumblr.Fox.chromeTrigger('chrome:refresh:following');
    },
    onBlog() {
      if (Tumblr.Fox.route.includes('settings')) { // a regex matcher for the route would be nice
        Tumblr.Fox.state.setState('disabled');
      } else {
        Tumblr.Fox.state.setState('user');
        if (!Tumblr.Fox.options.get('cachedUserPosts')) {
          Tumblr.Fox.chromeTrigger('chrome:cache:blogPosts');
        }
      }
    },
    onLikes() {
      Tumblr.Fox.state.setState('likes');
    },
    defaultRoute() {
      Tumblr.Fox.state.setState('disabled');
    }
  });

  Tumblr.Fox.router = new Tumblr.Fox.Router({
    controller: new Tumblr.Fox.RouteController(),
    appRoutes: {
      'blog/:blogname': 'onBlog',
      'dashboard': 'onDashboard',
      'following': 'onFollowing',
      'likes': 'onLikes',
      '*path':  'defaultRoute'
    },
    onRoute(name, path, args) {
      // console.log(arguments);
    }
  });

  Tumblr.Fox.getComponents({
    AutoComplete: '/svc/search/blog_search_typeahead',
    animation: 'webkitAnimationEnd',
    BlogSearch: 'this.onTermSelect',
    BlogSearchAutocompleteHelper: 'this.model.hasMatches()',
    BlogSearchPopover: 'popover--blog-search',
    ConversationsCollection: '/svc/conversations/participant_suggestions',
    ClickHandler: 'document.addEventListener("click",this._onClick,!0)}',
    EventBus: '_addEventHandlerByString',
    InboxCompose: '"inbox-compose"',
    PrimaComponent: '.uniqueId("component")',
    Poller: 'BasePoller',
    PopoverMixin:  '_crossesView',
    PeeprBlogSearch: 'peepr-blog-search',
    SearchResultView: 'inbox-recipients',
    KeyCommandsMixin: '__keyFn',
    Loader: 'this.createBarLoader()',
    Mixin: 'this.mixins=',
    SearchFilters: '[data-filter]',
    SearchFiltersPopover: 'blog-search-filters-popover',
    SearchInput: '$$(".blog-search-input")',
    TagsPopover: 'click [data-term]',
    TumblrModel: '.Model.extend({})',
    TumblrView: 'this._beforeRender'
  });

  Tumblr.Fox.addInitializer('initialize:constants', function (constants) { // TODO: change these to their corresponding constants value
    this.constants.following = constants.cachedFollowingCount;
    this.options.set('logging', constants.debug);
    this.options.set('cachedTags', (constants.cachedTagsCount !== 0));
    this.options.set('cachedUserPosts', (constants.cachedPostsCount >= constants.totalPostsCount));
    this.options.set('cachedFollowing', (constants.cachedFollowingCount !== 0));
    this.options.set('enableTextSearch', constants.fullTextSearch);
    this.options.set('firstRun', constants.firstRun);
    this.options.set('version', constants.version);
    this.options.set('test', constants.test);
    this.trigger('fox:constants:initialized', this.constants, this.options);
  });

  Tumblr.Fox.addInitializer('initialize:constants', function () {
    if (this.options.get('firstRun')) {
      this.trigger('initialize:firstRun');
    } else {
      this.off('initialize:firstRun');
    }
  });

  Tumblr.Fox.addInitializer('initialize:dependency:chromeMixin', function (ChromeMixin) {
    ChromeMixin.applyTo(Tumblr.Fox);
    this.fetchConstants();
    if (currentUser()) {
      this.updateConstants({
        currentUser: currentUser().toJSON(),
        formKey: this.constants.formKey
      });
    }
  });

  Tumblr.Fox.addInitializer('initialize:dependency:thoth', function(Thoth) {
    const events = {
      checkIntervalSecs: 10,
      events: {
        document: 'mousemove'
      },
      warningSecs: 1,
      timeoutSecs: 10
    };
    this.idleMonitor = new Thoth(events);
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
  });

  Tumblr.Fox.onInitialized(function () {
    Backbone.history.start();

    if (!this.options.get('cachedFollowing')) {
      this.chromeTrigger('chrome:refresh:following', ::this.Application.following.fetchAll);
    }
  });

  Tumblr.Fox.onHeartbeat('refreshFollowing', function () {
    this.chromeTrigger('chrome:refresh:following');
  });

});
