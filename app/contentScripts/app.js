module.exports = (function init(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { extend, last, omit } = _;
  const { currentUser } = Tumblr.Prima;
  const listItems = $('#posts').find('li');
  const attachNode = $(listItems[listItems.length - 1]);
  const formKey = $('#tumblr_form_key').attr('content');

  window.$ = $;

  const TumblrFox = function () {
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
    this.Application = {};
    this.Events = {}
    this.Utils = {};
    this.Source = {};
    this.Models = {};
    this.Listeners = {};
    this.Components = {};
    this.Mixins = {};

    extend(this.Events, Backbone.Events);

    this.initialize();
  };

  extend(TumblrFox.prototype, Backbone.Events);

  extend(TumblrFox.prototype, {
    initialize() {
      this.bindListeners();
    },
    bindListeners() {
      this.listenTo(this, 'fox:components:fetcherInitialized', ::this.bindComponentGet);
      this.listenTo(this, 'fox:components:add', ::this.emitDependency);
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
      } else if (name.includes('Source')) {
        this.Source[name] = new component();
      }
      this.Utils.ComponentFetcher.put(name, component);
    },
    bindComponentGet(ComponentFetcher) {
      this.get = ComponentFetcher.get.bind(ComponentFetcher);
      this.put = ComponentFetcher.put.bind(ComponentFetcher);
    },
    emitDependency(name, dependency) {
      this.trigger(`initialize:dependency:${name}`, dependency);
    },
    fetchConstants() {
      this.chromeTrigger('chrome:fetch:constants', response => {
        this.trigger('initialize:constants', response);
      });
    },
    sendUser() {
      this.chromeTrigger('chrome:initialize', {
        user: currentUser().toJSON(),
        formKey
      });
    }
  });

  Tumblr.Fox = new TumblrFox();

  Tumblr.Fox.on('initialize:constants', function (constants) {
    constants = omit(constants, '_events');
    this.options.set('logging', constants.debug);
    this.options.set('cachedTags', (constants.cachedTagsCount !== 0));
    this.options.set('enableTextSearch', constants.fullTextSearch);
    this.Events.trigger('fox:constants:initialized', this.constants, this.options);
    console.log('[TUMBLRFOX CONSTANTS]', constants);
    console.log('[TUMBLRFOX OPTIONS]', this.options.toJSON());
  })

  Tumblr.Fox.on('initialize:dependency:ChromeMixin', function (ChromeMixin) {
    ChromeMixin.applyTo(TumblrFox.prototype);
    this.fetchConstants();
    this.sendUser();
  });

  Tumblr.Fox.on('initialize:dependency:LikesListener', function (LikesListener) {
    this.likesListener = new LikesListener();
  });

  Tumblr.Fox.on('initialize:dependency:EventsListener', function (EventsListener) {
    const Events = extend({}, Tumblr.Fox.Events, Tumblr.Events, Tumblr.Prima.Events, Backbone.Events);
    this.eventsListener = new EventsListener({
      events: Events,
      options: this.options
    });
  });

  Tumblr.Fox.on('initialize:dependency:StateModel', function(State) {
    const routes = ['dashboard', 'likes', 'blog'];
    const route = last(window.location.href.split('/'));
    const awayFromPosts = !routes.includes(route);

    this.state = new State({
      dashboard: true,
      disabled: false,
      user: false,
      likes: false
    });

    if (window.location.href.includes('likes')) {
      this.state.setState('likes');
    } else if (window.location.href.includes('blog')) {
      this.state.setState('user');
    } else if (awayFromPosts) {
      this.state.setState('disabled');
    }
  });

  Tumblr.Fox.on('initialize:dependency:FollowerListComponent', function (FollowerList) {
    if (window.location.href.includes('following')) {
      this.Application.following = new FollowerList({
        el: $('#following')
      });
    }
  });

  Tumblr.Fox.on('initialize:dependency:FilterPopoverIcon', function (FilterPopover) {
    this.Application.filter = new FilterPopover({
      state: this.state,
      options: this.options
    });
    this.Application.filter.render();
  });
});
