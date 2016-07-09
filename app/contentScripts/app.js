module.exports = (function (Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { extend, camelCase, forIn, keys, last, omit, pick, uniqueId } = _;
  const { currentUser } = Tumblr.Prima;
  const { Tumblelog } = Tumblr.Prima.Models;
  const listItems = $('#posts').find('li');
  const attachNode = $(listItems[listItems.length - 1]);
  const formKey = $('#tumblr_form_key').attr('content');
  const icon = 'iVBORw0KGgoAAAANSUhEUgAAAGcAAABpCAYAAAAnSz2JAAACkklEQVR42u3c0U3DMBDGcW/BGKzBGIzBGozRNToGY6C+RElkGtEHqIJoEvv8ne9/z0jE3+/OTZM0KVG+Kt+KJGwz34Qzz/OJ2MSGIf8oorOB2YUDUL267kznwzgA1Z+aQzgA1YU5jANQPZgiONd98p14y8MUwWF66sAUwwFo15nZhxkOQGWnpjgOQMm+2fPGIn7DRt+KwzU4wybPOwoKowzzzoLEIL98oKARxokOVD23XKCAEcaJdgZn1tC5UAEjjBMByDyrXLjAEcb56x9nRyXTxFYL9Ixj1QBmOGtncMCI4Hjc3lpnYx6WFyCFXJoEpQ50f2yXy+UpDM7awTxyn92i1p4watWwTTtYcXpUmrU5jtoZnFKjJoW9X+XzRzEHyWBad22Lzz9ZnJZAyg2aIu/5rc7MXOK0/lautG5JnGEYnltcaFRryqT6Td363onqmmUvo1jdq1der6trXDUePwJHoNOVzsy6wSkF5K0J3eCM4/hy5Dg9NqAbnCOfF57X5/q28X/H631t7h5ZevSY7/9mmqZX9zgegVbOzN56aLougbqGud3TOCkv6LpNffa6TacIC+sWxvsC1Y977btbCCCVx6yqTo1XoFAwnhYdEmapZZ/MlB6Mx9/VhIIBSBwGIAc4AAnDACQOA5A4DDjCMACJwwD0XfIvRWdqAr0TBhiA4sDc7qmcgWF6gAHody1v9Ug9FFMDEDDRgVKvpf68clgY79OTohQwAJW6mHlOEYupAQiYvWXx/kxgOpoeRESBkBAFKvabGYCYmjBApC4KRNqiOCQtCkTCwkCkKwpEqqJApCkKRIqiOCQoCkRyokDL61ZITRSItESBSEkUiHQa1/LGQmAcTQ+JiALJ/2iWoqiK9QXVEo0oBz0DhAAAAABJRU5ErkJggg==';

  $.fn.removeAttributes = function (args) {
    const ignore = args.ignore;
    return this.each(function () {
      const attributes = $.map(this.attributes, item => {
        if (typeof ignore !== 'undefined' && item.name !== ignore) {
          return item.name;
        }
      });
      const elem = $(this);
      $.each(attributes, (i, item) => {
        elem.removeAttr(item);
      });
    });
  };

  window.$ = $;

  window.webpackJsonp(0, [function (module, exports, require) {
    window.webpackModules = Array.prototype.slice.call(arguments);
    window.require = require;
  }]);

  const TumblrFox = function () {
    this.require = window.require;

    this.constants = {
      attachNode,
      formKey,
      icon
    };

    this.options = new Model({
      firstRun: false,
      initialized: false,
      rendered: false,
      test: false,
      cachedTags: false,
      enableTextSearch: false
    });

    this.state = new Model({ // NOTE: state is actually a model initialized with these values when the dependency is loaded
      dashboard: true,
      disabled: false,
      user: false,
      likes: false
    });

    this.route = last(window.location.href.split('/'));

    this.Application = {};
    this.Class = {};
    this.Events = {}
    this.Utils = {};
    this.Source = {};
    this.Models = {};
    this.Listeners = {};
    this.Components = {};
    this.Mixins = {};

    this._initializers = {};
    this._intervalTasks = {};

    extend(this.Events, Backbone.Events);

    setInterval(() => {
      this.trigger('heartbeat');
      console.log('%c[TUMBLRFOX] %o', 'color:orange; font-size: 9pt', '♥');
    }, 200000);

    this.bindListeners();
  };

  extend(TumblrFox.prototype, Backbone.Events, {
    bindListeners() {
      this.listenTo(this, 'initialize:components:add', ::this.emitDependency);
      this.listenTo(this, 'initialize:components:done', ::this.unbindListeners);
    },
    unbindListeners() {
      this.stopListening(this, 'initialize:componentFetcher');
    },
    onHeartbeat(name, func) {
      this._intervalTasks[name] = func.bind(this);
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
            keys(this._intervalTasks).map(func => {
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
      this.chromeListenTo('bridge:initialized', () => {
        this.chromeTrigger('chrome:fetch:constants', response => {
          this.trigger('initialize:constants', response);
        });
      });
    },
    updateConstants(payload) {
      this.chromeTrigger('chrome:initialize:constants', payload);
    },
    onRoute(route) {
      console.log(route);
    }
  });

  Tumblr.Fox = new TumblrFox();

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
    this.options.set('logging', constants.debug);
    this.options.set('cachedTags', (constants.cachedTagsCount !== 0));
    this.options.set('cachedFollowing', (constants.cachedFollowersCount !== 0));
    this.options.set('enableTextSearch', constants.fullTextSearch);
    this.options.set('firstRun', constants.firstRun);
    this.options.set('version', constants.version);
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
    this.updateConstants({
      currentUser: currentUser().toJSON(),
      formKey: this.constants.formKey
    });
  });

  Tumblr.Fox.addInitializer('initialize:dependency:stateModel', function(State) { // TODO: add proper code to manage routes
    const routes = ['dashboard', 'likes', currentUser().id];
    const route = last(window.location.href.split('/'));
    const awayFromPosts = !routes.includes(route);

    extend(this.state, State.prototype);

    if (this.route.includes('likes')) {
      this.state.setState('likes');
    } else if (this.route.includes('blog')) {
      this.state.setState('user');
    } else if (awayFromPosts) {
      this.state.setState('disabled');
    }
  });

  Tumblr.Fox.addInitializer('initialize:dependency:followerListComponent', function (FollowerList) {
    if (this.route.includes('following')) {
      this.Application.following = new FollowerList();
    }
  });

  Tumblr.Fox.once('initialized', function () {
    if (this.route.includes('following')) {
      return;
    }
    this.chromeTrigger('chrome:fetch:following', following => {
      following.forEach(follower => {
        if (!Tumblelog.collection.findWhere({ name: follower.name })) {
          this.Source.BlogSource.getInfo(follower.name).then(response => {
            Tumblelog.collection.add(new Tumblelog(response));
          });
        }
      });
    });
    this.chromeTrigger('chrome:validate:cache', valid => {
      if (!valid) {
        // this.chromeTrigger('chrome:cache:blogPosts');
      }
    });
    this.chromeListenTo('chrome:response:error', e => {
      const error = e.detail;
      Tumblr.Dialog.alert(error);
    })
  });

  Tumblr.Fox.onHeartbeat('refreshFollowing', function () { // TODO: add follower tumblogs to collection
    this.chromeTrigger('chrome:refresh:following');
  });
});
