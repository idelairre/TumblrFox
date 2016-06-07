module.exports = (function searchComponent(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { assign, capitalize, cloneDeep, debounce, each, extend, isEmpty, isString, mapKeys, omit } = _;
  const { get, chromeMixin, loaderMixin, TagSearchAutocompleteModel, TextSearchAutocompleteModel, Dashboard, Filters, Posts, Likes, Settings, Input, Toggle } = Tumblr.Fox;
  const PeeprBlogSearch = get('PeeprBlogSearch');
  const PeeprPostsModel = get('PeeprPostsModel');
  const SearchResultView = get('SearchResultView');
  const EventBus = get('EventBus');
  const ConversationsCollection = get('ConversationsCollection');
  const InboxCompose = get('InboxCompose');
  const BlogSearch = get('BlogSearch');

  const Conversations = new ConversationsCollection();

/**
 * NB: component states:
 *    initial load => default user => post model loads unfiltered dashboard posts from tumblr client
 *     1. select user (has tags) => post model loads unfiltered blog posts from tumblr client =>
 *       a. select tag / filter => post model loads filtered blog posts from tumblr client
 *       b. (TODO) doesn't select tag => post model loads filtered posts from tumblr api
 *     2. select user (no tags) => post model loads unfiltered blog posts from tumblr client =>
 *       a. (TODO) select filter => post model loads filtered blog posts from tumblr api
 *       b. (TODO) select user (no tags) => select liked posts filter => post model fetches user likes from api
 */

  const defaultFilter = cloneDeep(PeeprBlogSearch.prototype.subviews.filters.constructor.prototype);

  extend(PeeprBlogSearch.prototype.subviews.input.constructor.prototype, Input);

  const FiltersPopover = {
    showPopover() {
      this.popover = new Filters({
        pinnedTarget: this.$el,
        model: this.model,
        preventInteraction: !0
      });
      this.popover.render();
      this.listenTo(this.popover, 'close', this.onPopoverClose);
    },
    onPopoverClose() {
      PeeprBlogSearch.prototype.subviews.filters.constructor.prototype = defaultFilter;
      PeeprBlogSearch.prototype.subviews.filters.constructor.prototype.onPopoverClose.call(this);
    }
  };

  const SearchComponent = PeeprBlogSearch.extend({
    className: 'filter-search',
    template: $('#searchFilterTemplate').html(),
    mixins: [chromeMixin, loaderMixin],
    subviews: assign({}, PeeprBlogSearch.prototype.subviews, {
      searchResultView: {
        constructor: SearchResultView,
        options: {
          eventBus: new EventBus(), // what is this thing?
          collection: Conversations,
          context: 'input'
        }
      },
      settings: {
        constructor: Settings,
        options: {
          isFixedPosition: true,
          autoTeardown: false,
          teardownOnEscape: false
        }
      },
      toggle: {
        constructor: Toggle,
        options: {
          name: 'users'
        }
      }
    }),
    initialize(e) {
      this.options = assign({}, e);
      this.state = Tumblr.Fox.state;
      this.searchOptions = Tumblr.Fox.searchOptions;
      this.blog = e.blog;
      // this is the crazy filter dropdown
      this.model = new BlogSearch({
        blogname: Tumblr.Prima.currentUser().id,
        themeParams: this.blog.get('global_theme_params')
      });
      this.posts = new Posts({
        blogSearch: this.model
      });
      console.log('[SEARCH COMPONENT]: ', this, this.model);
      this.initializeSubviews();
    },
    initializeSubviews() {
      assign(this.subviews.filters.constructor.prototype, FiltersPopover);
      each(this.subviews, subview => {
        subview.options = subview.options || {};
        subview.options.model = this.model;
      });
    },
    render() {
      this.$el.html(this.template);
      this.bindEvents();
    },
    afterRenderSubviews() {
      this.$userList = this.searchResultView.$el;
      this.$filters = this.filters.$el;
      this.$settings = this.settings.$el;
      this.input.conversations = Conversations;
      this.input.conversations.fetchFavorites({
         data: {
           limit: 4
         }
       });
      this.input.model.set(this.options); // this enables the nsfw filter
      this.input.$el.find('input').attr('data-js-textinput', '');
      this.set('showUserList', false);
    },
    events: {
      'submit .dashboard-search-form': 'formSubmitHandler',
      'click .toggle-users': 'setUserList',
      'click [data-start-conversation]': 'selectBlog',
      'click .post_type_filter': 'onFormClick',
      'click .blog-search-input': 'onFormClick'
    },
    bindEvents() {
      this.listenTo(this, 'change:showUserList', ::this.toggleUserList);
      this.listenTo(this.model, 'change:blogname', ::this.onChangeBlog); // reset term, fetch new posts
      this.listenTo(this.model.posts, 'reset', ::this.onPostsReset);
      this.listenTo(this.model.posts, 'add', ::this.onPostsAdd);
      this.listenTo(this.model, 'search:reset', ::this.onSearchReset);
      this.listenTo(this.model, 'change:next_offset', ::this.onOffsetChange);
      this.listenTo(this.model, 'change:term', this.log.bind(this, 'search-start', {}));
      this.listenTo(Tumblr.Events, 'indashblog:search:start', ::this.onFetchRequested);
      this.listenTo(Tumblr.Events, 'peepr-search:search-complete', this.toggleLoading.bind(this, false));
      this.listenTo(Tumblr.Fox.searchOptions, 'change:state', ::this.setSearchOption);
      this.listenTo(Tumblr.Fox.state, 'change:state', ::this.updateSearchSettings);
      this.listenTo(Tumblr.Events, 'fox:setFilter', ::this.setFilter);
    },
    unbindEvents() {
      // unbind shit
    },
    log() {
      PeeprBlogSearch.prototype.log.apply(this, arguments);
    },
    selectBlog(e) { // NOTE: triggers #onBlogChange()
      const tumblelog = this.$(e.target).parent().find('h3').text();
      this.model.set('blog', this.input.conversations.where({ name: tumblelog })[0]);
      this.model.set('blogname', tumblelog);
      this.model.set('loggingData', omit(this.model.attributes, 'loggingData'));
      this.setUserList();
      Tumblr.Events.trigger('fox:setSearchState', 'user');
      if (this.searchOptions.get('text')) {
        this.chromeTrigger('chrome:search:setBlog', tumblelog);
      }
      Tumblr.AutoPaginator.stop();
      this.posts.state.setState('userSearch');
    },
    setFilter(slug) {
      this.model.set('post_type', slug.loggingData.post_type);
      this.model.set('next_offset', 0);
    },
    onChangeBlog() {
      this.model.set('term', '');
      this.model.set('next_offset', 0);
      if (!this.searchOptions.get('text')) {
        // Tumblr.Events.trigger('fox:filterFetch:started', model.attributes);
      }
    },
    onFetchRequested() {
      this.model.set('next_offset', 0);
      this.toggleLoading(true);
      Tumblr.Events.trigger('fox:searchStarted');
      this.posts.search(this.model.attributes).then(() => {
        this.toggleLoading(false);
      });
    },
    setSearchOption(state) {
      this.$el.find('.popover_header').find('span.header_title').text(`${state} search`);
    },
    updateSearchSettings(state) {
      if (state === 'dashboard') {
        this.showUserList ? this.setUserList() : null;
      }
    },
    setUserList(e) {
      e ? e.preventDefault() : null;
      this.set('showUserList', this.showUserList = !this.showUserList);
      this.toggle.state.set('toggled', this.showUserList);
    },
    toggleUserList(e) {
      this.delegateInputEvents(e);
      if (e.showUserList) {
        this.$userList.show();
        this.$settings.hide();
        this.$filters.find('i').hide();
        this.posts.state.setState('userSearch');
      } else {
        this.$userList.hide();
        this.$settings.show();
        this.$filters.find('i').show();
      }
    },
    delegateInputEvents(e) {
      if (e.showUserList) {
        this.input.undelegateEvents();
        this.filters.undelegateEvents();
        this.input.blogSearchAutocompleteHelper.undelegateEvents();
        this.input.delegateEvents(InboxCompose.prototype.events);
        this.searchResultView.delegateEvents();
      } else {
        this.input.undelegateEvents();
        this.input.delegateEvents();
        this.filters.delegateEvents();
        this.input.blogSearchAutocompleteHelper.delegateEvents();
      }
    }
  });

  Tumblr.Fox.SearchComponent = SearchComponent;
});
