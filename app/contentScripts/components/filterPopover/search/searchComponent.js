module.exports = (function searchComponent(Tumblr, Backbone, _) {
  const { assign, each, omit, pick } = _;
  const { get, Utils } = Tumblr.Fox;
  const { ComponentFetcher, TemplateCache } = Utils;
  const { EventBus, InboxCompose, LoaderMixin, PeeprBlogSearch } = ComponentFetcher.getAll('ChromeMixin', 'ConversationsCollection', 'EventBus', 'FiltersDropDownComponent', 'InboxCompose', 'LoaderMixin', 'PeeprBlogSearch');

/**
 *  SearchComponent states:
 *    initial load => default user => post model loads unfiltered dashboard posts from tumblr client
 *     1. select user (has tags) => post model loads unfiltered blog posts from tumblr client =>
 *       a. select tag / filter => post model loads filtered blog posts from tumblr client
 *       b. doesn't select tag => post model loads filtered posts from tumblr api
 *     2. select user (no tags) => post model loads unfiltered blog posts from tumblr client =>
 *       a. (TODO) select filter => post model loads filtered blog posts from tumblr api
 *       b. (TODO) select user (no tags) => select liked posts filter => post model fetches user likes from api
 */

  const SearchComponent = PeeprBlogSearch.extend({
    className: 'filter-search',
    template: TemplateCache.get('searchFilterTemplate'),
    mixins: [LoaderMixin],
    dependencies: ComponentFetcher.getAll(['BlogSearch', 'PostsModel']),
    subviews: {
      filters: {
        constructor: get('FiltersComponent'),
        options: opts => {
          return {
            model: opts.model,
            state: opts.state,
            searchOptions: opts.searchOptions,
            FiltersDropDown: get('FiltersDropDownComponent')
          };
        }
      },
      input: {
        constructor: get('InputComponent'),
        options: opts => {
          return {
            model: opts.model,
            conversations: opts.conversations,
            state: opts.state,
            searchOptions: opts.searchOptions
          };
        }
      },
      searchResultView: {
        constructor: get('SearchResultView'),
        options: opts => {
          return {
            eventBus: new EventBus(), // what is this thing?
            collection: opts.conversations,
            context: 'input'
          };
        }
      },
      settings: {
        constructor: get('SettingsComponent'),
        options: {
          isFixedPosition: true,
          autoTeardown: false,
          teardownOnEscape: false
        }
      },
      toggle: {
        constructor: get('ToggleComponent'),
        options: {
          name: 'users'
        }
      }
    },
    initialize(options) {
      assign(this, pick(options, ['blog', 'conversations', 'searchOptions', 'state']));
      const { BlogSearch, PostsModel } = this.dependencies;
      this.model = new BlogSearch({
        blogname: Tumblr.Prima.currentUser().id,
        themeParams: this.blog.get('global_theme_params')
      });
      this.posts = new PostsModel({
        blogSearch: this.model,
        state: this.state,
        searchOptions: this.searchOptions
      });
      this.initializeSubviews();
    },
    initializeSubviews() {
      // extend(this.subviews.filters.constructor.prototype, FiltersPopover);
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
      this.$input = this.input.$el;
      this.$input.find('input').attr('data-js-textinput', '');
      this.input.model.set(this.options); // this enables the nsfw filter
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
      this.listenTo(this.state, 'change:state', ::this.updateSearchSettings);
      this.listenTo(this.searchOptions, 'change:state', ::this.setSearchOption);
      this.listenTo(Tumblr.Events, 'indashblog:search:start', ::this.onFetchRequested);
      this.listenTo(Tumblr.Events, 'peepr-search:search-complete', this.toggleLoading.bind(this, false));
      this.listenTo(Tumblr.Events, 'peepr-search:search-reset', ::this.resetTerm);
      this.listenTo(Tumblr.Events, 'fox:setFilter', ::this.setFilter);
    },
    unbindEvents() {
      this.stopListening();
    },
    log() {
      PeeprBlogSearch.prototype.log.apply(this, arguments);
    },
    resetTerm() {
      this.model.set('term', ''); // NOTE: there is maybe a method apart of the PeeprBlogSearch class that does this
      if (this.searchOptions.get('tag') && (this.model.hasChanged('post_type') || this.model.hasChanged('post_role') || this.model.hasChanged('filter_nsfw'))) {
        this.onFetchRequested();
      }
    },
    selectBlog(e) { // NOTE: triggers #onBlogChange()
      const tumblelog = this.$(e.target).parent().find('h3').text();
      this.model.set('blog', this.input.conversations.where({ name: tumblelog })[0]);
      this.model.set('blogname', tumblelog);
      this.model.set('loggingData', omit(this.model.attributes, 'loggingData'));
      this.setUserList();
      Tumblr.Events.trigger('fox:changeUser', this.model.get('blogname'));
      if (this.state.getState() !== 'user') {
        this.state.setState('user');
      }
      // NOTE: removed autopaginator stop
      if (!this.posts.state.get('user')) {
        this.posts.state.setState('user');
      }
    },
    setFilter() { // TODO: figure out why this doesn't work but filtering does work
      // this.model.set('post_type', type);
      this.model.set('next_offset', 0);
      Tumblr.Events.trigger('indashblog:search:start'); // NOTE: toggles #onFetchFequested()
    },
    onChangeBlog() {
      this.model.set('term', '');
      this.model.set('next_offset', 0);
      Tumblr.Events.trigger('indashblog:search:start');
    },
    onFetchRequested() {
      if (this.posts.get('loading')) {
        return;
      }
      this.model.set('next_offset', 0);
      this.toggleLoading(true);
      this.posts.search(this.model.toJSON()).then(() => {
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
        if (this.posts.state.getState() !== 'user') {
          this.posts.state.setState('user');
        }
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

  Tumblr.Fox.register('SearchComponent', SearchComponent);
});
