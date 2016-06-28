module.exports = (function main(Tumblr, Backbone, _) {
  const { ComponentFetcher } = Tumblr.Fox.Utils;
  const { assign, extend, last } = _;
  const { currentUser } = Tumblr.Prima;

  const AUTOCOMPLETE = '/svc/search/blog_search_typeahead';
  const ANIMATION = 'webkitAnimationEnd';
  const BLOG_SEARCH = 'this.onTermSelect';
  const BLOG_SEARCH_AUTOCOMPLETE_HELPER = 'this.model.hasMatches()';
  const BLOG_SEARCH_POPOVER = 'popover--blog-search';
  const CONVERSATIONS_COLLECTION = '/svc/conversations/participant_suggestions';
  const CLICK_HANDLER = 'document.addEventListener("click",this._onClick,!0)}';
  const EVENT_BUS = '_addEventHandlerByString'
  const INBOX_COMPOSE = '"inbox-compose"';
  const PRIMA_COMPONENT = '.uniqueId("component")';
  const POPOVER_MIXIN = '_crossesView';
  const PEEPR_BLOG_SEARCH = 'peepr-blog-search';
  const SEARCH_RESULT_VIEW = 'inbox-recipients';
  const KEY_COMMANDS_MIXIN = '__keyFn';
  const LOADER = 'this.createBarLoader()';
  const MIXIN = 'this.mixins=';
  const SEARCH_FILTERS = '[data-filter]';
  const SEARCH_FILTERS_POPOVER = 'blog-search-filters-popover';
  const SEARCH_INPUT = '$$(".blog-search-input")';
  const TAGS_POPOVER = 'click [data-term]';
  const TUMBLR_MODEL = '.Model.extend({})';
  const TUMBLR_VIEW = 'this._beforeRender';

  ComponentFetcher.getComponents({
    AutoComplete: AUTOCOMPLETE,
    animation: ANIMATION,
    BlogSearch: BLOG_SEARCH,
    BlogSearchAutocompleteHelper: BLOG_SEARCH_AUTOCOMPLETE_HELPER,
    BlogSearchPopover: BLOG_SEARCH_POPOVER,
    ConversationsCollection: CONVERSATIONS_COLLECTION,
    ClickHandler: CLICK_HANDLER,
    EventBus: EVENT_BUS,
    InboxCompose: INBOX_COMPOSE,
    PrimaComponent: PRIMA_COMPONENT,
    PopoverMixin: POPOVER_MIXIN,
    PeeprBlogSearch: PEEPR_BLOG_SEARCH,
    SearchResultView: SEARCH_RESULT_VIEW,
    KeyCommandsMixin: KEY_COMMANDS_MIXIN,
    Loader: LOADER,
    Mixin: MIXIN,
    SearchFilters: SEARCH_FILTERS,
    SearchFiltersPopover: SEARCH_FILTERS_POPOVER,
    SearchInput: SEARCH_INPUT,
    TagsPopover: TAGS_POPOVER,
    TumblrModel: TUMBLR_MODEL,
    TumblrView: TUMBLR_VIEW
  });

  extend(Backbone.Model, ComponentFetcher.get('TumblrModel'));

  Tumblr.Fox.on('initialize:constants', function (constants) {
    this.options.set('logging', constants.debug);
    this.options.set('cachedTags', (constants.cachedTagsCount !== 0));
    this.options.set('cachedFollowing', (constants.cachedFollowersCount !== 0));
    this.options.set('enableTextSearch', constants.fullTextSearch);
    this.options.set('firstRun', constants.firstRun);
    this.options.set('version', constants.version);
    this.trigger('fox:constants:initialized', this.constants, this.options);
    if (this.options.get('firstRun')) {
      this.trigger('initialize:firstRun');
    }
  });

  Tumblr.Fox.on('initialize:dependency:chromeMixin', function (ChromeMixin) {
    ChromeMixin.applyTo(Tumblr.Fox);
    this.fetchConstants();
    this.updateConstants({
      currentUser: currentUser().toJSON(),
      formKey: this.constants.formKey
    });
  });

  Tumblr.Fox.on('initialize:dependency:stateModel', function(State) {
    const routes = ['dashboard', 'likes', currentUser().id];
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

  Tumblr.Fox.on('initialize:dependency:followerListComponent', function (FollowerList) {
    if (window.location.href.includes('following')) {
      this.Application.following = new FollowerList({
        el: $('#following')
      });
    }
  });

  Tumblr.Fox.on('initialize:dependency:filterPopoverIcon', function (FilterPopover) {
    this.Application.filter = new FilterPopover({
      state: this.state,
      options: this.options
    });
    this.Application.filter.render();
  });

  // Tumblr.Fox.on('initialize:firstRun', function () {
  //   Tumblr.Dialog.alert({
  //     templates: {
  //       content: `<div class="text">TumblrFox ${this.options.get('version')} installed. Release notes: <a href="https://github.com/idelairre/TumblrFox/releases/tag/v${this.options.get('version')}" target="_blank">link</a></div>`
  //     },
  //     callback_ok: () => {
  //       this.updateConstants({
  //         firstRun: false
  //       });
  //     }
  //   });
  // });
});
