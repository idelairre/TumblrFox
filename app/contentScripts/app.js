module.exports = (function (Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { extend, camelCase, forIn, last, omit, pick } = _;
  const { currentUser } = Tumblr.Prima;
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

    this._state = { // NOTE: state is actually a model initialized with these values when the dependency is loaded
      dashboard: true,
      disabled: false,
      user: false,
      likes: false
    };

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

    extend(this.Events, Backbone.Events);

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
    register(name, component) {
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
        this.Listeners[name] = component;
      } else if (name.includes('Source')) {
        this.Source[name] = new component();
        this.Utils.ComponentFetcher.put(name, this.Source[name]);
        return;
      }
      this.Utils.ComponentFetcher.put(name, component);
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
    addInitializer(event, callback) {
      this._initializers[event] = {
        called: false,
        callback
      };
      this.once(event, component => {
        callback.call(Tumblr.Fox, component);
        this._initializers[event].called = true;
        if (this._checkInitializers()) {
          this.trigger('initialized');
          this.off();
          delete this._initializers;
          delete this._state;
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
    emitDependency(name, dependency) {
      this.trigger(`initialize:dependency:${camelCase(name)}`, dependency);
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
    }
  });

  Tumblr.Fox = new TumblrFox();

  Tumblr.Fox.addInitializer('initialize:constants', function (constants) {
    this.options.set('logging', constants.debug);
    this.options.set('cachedTags', (constants.cachedTagsCount !== 0));
    this.options.set('cachedFollowing', (constants.cachedFollowersCount !== 0));
    this.options.set('enableTextSearch', constants.fullTextSearch);
    this.options.set('firstRun', constants.firstRun);
    this.options.set('version', constants.version);
    this.trigger('fox:constants:initialized', this.constants, this.options);
    if (this.options.get('firstRun')) {
      this.trigger('initialize:firstRun');
    } else {
      this.off('initialize:firstRun');
    }
  });

  Tumblr.Fox.addInitializer('initialize:componentFetcher', function (ComponentFetcher) {
    ComponentFetcher.getComponents({
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
      Toastr: "toastTime",
      TumblrModel: '.Model.extend({})',
      TumblrView: 'this._beforeRender'
    });
    this.get = ComponentFetcher.get.bind(ComponentFetcher);
    this.put = ComponentFetcher.put.bind(ComponentFetcher);
    extend(Backbone.Model, ComponentFetcher.get('TumblrModel'));
  });

  Tumblr.Fox.addInitializer('initialize:dependency:chromeMixin', function (ChromeMixin) {
    ChromeMixin.applyTo(Tumblr.Fox);
    this.fetchConstants();
    this.updateConstants({
      currentUser: currentUser().toJSON(),
      formKey: this.constants.formKey
    });
  });

  Tumblr.Fox.addInitializer('initialize:dependency:stateModel', function(State) {
    const routes = ['dashboard', 'likes', currentUser().id];
    const route = last(window.location.href.split('/'));
    const awayFromPosts = !routes.includes(route);

    this.state = new State(this._state);

    if (window.location.href.includes('likes')) {
      this.state.setState('likes');
    } else if (window.location.href.includes('blog')) {
      this.state.setState('user');
    } else if (awayFromPosts) {
      this.state.setState('disabled');
    }
  });

  Tumblr.Fox.addInitializer('initialize:dependency:likesListener', function (LikesListener) {
    this.Listeners['LikesListener'] = new LikesListener();
  });

  Tumblr.Fox.addInitializer('initialize:dependency:eventsListener', function (EventsListener) {
    this.Listeners['EventsListener'] = new EventsListener({
      options: this.options
    });
  });

  Tumblr.Fox.addInitializer('initialize:dependency:postsListener', function (PostsListener) {
    this.Listeners['PostsListener'] = new PostsListener();
  });

  Tumblr.Fox.addInitializer('initialize:dependency:followerListComponent', function (FollowerList) {
    if (window.location.href.includes('following')) {
      this.Application.following = new FollowerList();
    }
  });
});
