module.exports = (function init(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { extend, omit } = _;
  const { currentUser } = Tumblr.Prima;
  const listItems = $('#posts').find('li');
  const attachNode = $(listItems[listItems.length - 1]);
  const formKey = $('#tumblr_form_key').attr('content');
  const Events = extend({}, Tumblr.Events, Tumblr.Prima.Events, Backbone.Events);

  const TumblrFox = function () {
    this.initialized = false;
    this.constants = {
      attachNode,
      formKey
    };
    this.options = new Model({
      rendered: false,
      test: false,
      cachedTags: false,
      enableTextSearch: false
    });

    this.state = {};
    this.searchOptions = {};

    this.Utils = {};
    this.Models = {};
    this.Listeners = {};
    this.Components = {};
    this.Mixins = {};

    this.initialize();
  };

  extend(TumblrFox.prototype, Tumblr.Events, Backbone.Events);

  extend(TumblrFox.prototype, {
    initialize() {
      this.bindListeners();
    },
    bindListeners() {
      this.listenTo(this, 'fox:components:fetcherInitialized', ::this.bindComponentGet);
      this.listenTo(this, 'fox:components:add', ::this.initializeDependencies);
    },
    register(name, component) {
      if (name.includes('Model')) {
        this.Models[name] = component;
      } else if (name.includes('Component') || name.includes('Container')) {
        this.Components[name] = component;
      } else if (name.includes('Mixin')) {
        this.Mixins[name] = component;
      } else if (name.includes('Listener')) {
        this.Listeners[name] = component;
      }
      this.Utils.ComponentFetcher.put(name, component);
    },
    bindComponentGet(ComponentFetcher) {
      this.get = ComponentFetcher.get.bind(ComponentFetcher);
      this.put = ComponentFetcher.put.bind(ComponentFetcher);
    },
    initializeChromeListeners() {
      this.chromeListenTo('chrome:backbone', response => {
        console.log(response);
      });
    },
    initializeDependencies(name) {
      switch (name) {
        case 'ChromeMixin': {
          extend(TumblrFox.prototype, this.get('ChromeMixin').properties);
          this.fetchConstants();
          this.initializeChromeListeners();
          this.sendUser();
          break;
        }
        case 'LikesListener': {
          const LikesListener = this.get('LikesListener');
          this.likesListener = new LikesListener();
          break;
        }
        case 'EventsListener': {
          const EventsListener = this.get('EventsListener');
          this.eventsListener = new EventsListener({
            events: Events,
            options: this.options
          });
          break;
        }
        case 'StateModel': {
          const State = this.get('StateModel');
          this.state = new State({
            dashboard: true,
            user: false,
            likes: false
          });
          this.searchOptions = new State({
            tag: true,
            text: false
          });
          break;
        }
        case 'FollowerListComponent': {
          if (window.location.href === 'https://www.tumblr.com/following') {
            this.initializeFollowing();
          }
          break;
        }
        case 'FilterPopoverIcon': {
          const FilterPopoverIcon = this.get('FilterPopoverIcon');
          const FoxIcon = new FilterPopoverIcon({
            state: this.state,
            searchOptions: this.searchOptions,
            options: this.options
          });
          this.App = FoxIcon;
          this.App.render();
          break;
        }
      }
    },
    initializeFollowing() {
      const FollowerList = this.get('FollowerListComponent');
      this.App = new FollowerList({
        el: $('#following')
      });
    },
    fetchConstants() {
      this.chromeTrigger('chrome:fetch:constants', ::this._initializeConstants);
    },
    sendUser() {
      this.chromeTrigger('chrome:initialize', {
        user: currentUser().toJSON(),
        formKey
      });
    },
    _initializeConstants(constants) {
      constants = omit(constants, '_events');
      this.options.set('logging', constants.debug);
      this.options.set('cachedTags', (constants.cachedTagsCount !== 0));
      this.options.set('enableTextSearch', constants.fullTextSearch);
      Tumblr.Events.trigger('fox:constants:initialized', this.constants, this.options);
      console.log('[TUMBLRFOX CONSTANTS]', constants);
      console.log('[TUMBLRFOX OPTIONS]', this.options.toJSON());
    }
  });

  Tumblr.Fox = new TumblrFox();
});
