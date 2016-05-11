module.exports = (function searchComponent(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { clone, debounce, each, isEmpty } = _;
  const { get, loaderMixin, TagSearchAutocompleteModel, Filters, Posts, Settings } = Tumblr.Fox;
  const PeeprBlogSearch = get('PeeprBlogSearch');
  const SearchResultView = get('SearchResultView');
  const EventBus = get('EventBus');
  const ConversationsCollection = get('ConversationsCollection');
  const InboxCompose = get('InboxCompose');
  const BlogSearch = get('BlogSearch');

  const Conversations = new ConversationsCollection();

  // TODO: handle if there are no results in the tag search, i.e., if the next offset is -1

  /* states:
      initial load => default user => post model loads unfiltered dashboard posts from tumblr client
         select user (has tags) => post model loads unfiltered blog posts from tumblr client
           select tag / filter => post model loads filtered blog posts from tumblr client
            no tag => post model loads filtered posts from tumblr api
         select user (no tags) => post model loads unfiltered blog posts from tumblr client
            select filter => post model loads filtered blog posts from tumblr api
         select user (no tags) => select liked posts filter => post model fetches user likes from api */

  const defaultFilter = clone(PeeprBlogSearch.prototype.subviews.filters.constructor.prototype);

  const InputExtension = {
    tagSearchAutocompleteModel: TagSearchAutocompleteModel,
    fetchResults(query) {
      // console.log('[USER QUERY]', query);
      return Conversations.fetch({ data: { q: query, limit: 8 }});
    },
    _search(e) {
      this.fetchResults(e);
    },
    _debouncedSearch(query) {
      return debounce(this._search, 250).call(this, query);
     },
    _onTextInputChange(e) {
      this._debouncedSearch(this.$(e.target).val());
    },
    _onTextInputBlur(e) {
      this._debouncedSearch(this.$(e.target).val());
    }
  };

  const FiltersPopover = {
    showPopover() {
      this.popover || (this.popover = new Filters({
        pinnedTarget: this.$el,
        model: this.model,
        preventInteraction: !0
      }),
      this.popover.render(),
      this.listenTo(this.popover, 'close', this.onPopoverClose));
    },
    onPopoverClose() {
      Object.assign(PeeprBlogSearch.prototype.subviews.filters.constructor.prototype, defaultFilter);
      PeeprBlogSearch.prototype.subviews.filters.constructor.prototype.onPopoverClose.call(this);
    }
  };

  const SearchComponent = PeeprBlogSearch.extend({
    className: 'filter-search',
    template: $('#searchFilterTemplate').html(),
    mixins: [loaderMixin],
    defaults: {
      state: {
        likes: !1,
        dashboard: !1,
        user: !0
      }
    },
    subviews: Object.assign(PeeprBlogSearch.prototype.subviews, {
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
          isFixedPosition: !0,
          autoTeardown: !1,
          teardownOnEscape: !1
        }
      }
    }),
    initialize(e) {
      this.options = Object.assign({}, this.defaults, e);
      this.state = this.defaults.state;
      this.searchActive = !1;
      this.blog = e.blog;
      // this is the crazy filter dropdown
      this.model = new BlogSearch({
        blogname: Tumblr.Prima.currentUser().id,
        themeParams: this.blog.get('global_theme_params')
      });
      this.initializeSubviews();
    },
    initializeSubviews() {
      Object.assign(this.subviews.filters.constructor.prototype, FiltersPopover);
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
      this.input.model.set(this.options); // this enables the nsfw filter
      this.input.$el.find('input').attr('data-js-textinput', '');
      Object.assign(this.input, InputExtension);
      this.set('showUserList', false);
    },
    evalItems(data) {
      console.log('[TAGS]', data);
      if (isEmpty(data.tags)) {
        console.log('[INPUT]', this.input);
        // this.input.blogSearchAutocompleteModel.items.reset([]);
        this.input.$el.find('input').attr('placeholder', `${this.model.get('blogname')} has no tags`);
      }
    },
    selectBlog(e) {
      e.preventDefault();
      const tumblelog = this.$(e.target).parent().find('h3').text();
      this.model.set('blogname', tumblelog);
      this.input.blogSearchAutocompleteModel.set('blogname', tumblelog);
      this.input.$el.find('input').attr('placeholder', `Search ${tumblelog}`);
      this.input.$el.find('input').val('');
      this.input.blogSearchAutocompleteModel.fetch().then(::this.evalItems);
      this.set('showUserList', this.showUserList = !this.showUserList);
      this.trigger(Tumblr.Events, 'fox:setSearchState', 'user');
      Tumblr.AutoPaginator.stop();
      Posts.state.apiFetch = !1;
    },
    log(query) {
      console.log('[QUERY]', query);
      if (query === 'search-complete' || query === 'search-results-end' || this.model.previous('term') === query.term) { // || this.model.previous('term') === query.term
        this.toggleLoader(false);
        return;
      }
      if (this.state.likes) {
        this.toggleLoader(true);
        return Posts.searchLikes(this.model.attributes).then(() => {
          this.toggleLoader(false);
        });
      } else if (this.state.dashboard) {
        this.toggleLoader(true);
        return Posts.searchDashboard(this.model.attributes).then(() => {
          this.toggleLoader(false);
        });
      }
      // go to weird default Tumblr behavior
      this.toggleLoader(true);
      this.searchStarted = !0;
      this.model.set(query);
      this.model.fetch();
    },
    events: {
      'submit .dashboard-search-form': 'formSubmitHandler',
      'click .toggle-user': 'setUserList',
      'click [data-start-conversation]': 'selectBlog',
      'click .post_type_filter': 'onFormClick',
      'click .blog-search-input': 'onFormClick'
    },
    bindEvents() {
      // TODO: make these conditional on state
      // NOTE: unbinding these makes it difficult to rebind them for some reason
      this.listenTo(this, 'change:showUserList', this.toggleUserList);
      this.listenTo(this, 'change:showUserList', this.delegateInputEvents);
      this.listenTo(this.model, 'change:blogname', this.onChangeBlog); // reset term, fetch new posts
      this.listenTo(this.model.posts, 'reset', ::this.onPostsReset);
      this.listenTo(this.model.posts, 'add', ::this.onPostsAdd);
      this.listenTo(this.model, 'search:reset', ::this.onSearchReset);
      this.listenTo(this.model, 'change:next_offset', ::this.onOffsetChange);
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', this.log);
      this.listenTo(Tumblr.Events, 'indashblog:search:fetch-requested', ::this.onFetchRequested);
      this.listenTo(Tumblr.Events, 'peepr-search:search-complete', ::this.updateLog);
      this.listenTo(Tumblr.Events, 'fox:setSearchState', ::this.updateSearchSettings);
      this.listenTo(Tumblr.Events, 'fox:setFilter', ::this.updateLog);
      // this.listenTo(Tumblr.Events, 'DOMEventor:keyup:enter', ::this.search);
    },
    unbindEvents() {
      // unbind shit
    },
    setFilter(model) {
      if (!this.state.likesSearch) {
        return;
      }
      console.log(model.changed);
      if (!model.changed.unsetTerm && !model.changed.term && model.changed.term !== '' && model.changed.unsetTerm !== '') { // not happy with this
        this.toggleLoader(true),
        Posts.searchLikes(model.attributes).then(() => {
          this.toggleLoader(false);
        });
      }
    },
    updateSearchSettings(state) {
      console.log('[UPDATE SEARCH SETTINGS] called', this);
      if (state === 'dashboard') {
        this.showUserList ? this.setUserList() : null;
        this.input.$el.find('input').attr('placeholder', 'Search dashboard');
        this.input.$el.find('input').val('');
        this.input.tagSearchAutocompleteModel.state = this.state;
        this.input.blogSearchAutocompleteHelper.model = this.input.tagSearchAutocompleteModel;
        this.input.blogSearchAutocompleteHelper.model.fetch();
      } else if (state === 'likes') {
        this.input.$el.find('input').attr('placeholder', 'Search likes');
        this.input.$el.find('input').val('');
        this.input.tagSearchAutocompleteModel.state = this.state;
        this.input.blogSearchAutocompleteHelper.model = this.input.tagSearchAutocompleteModel;
        this.input.blogSearchAutocompleteHelper.model.fetch();
      } else {
        this.input.$el.find('input').attr('placeholder', `Search ${this.model.get('blogname')}`);
        this.input.$el.find('input').val('');
        this.input.blogSearchAutocompleteHelper.model = this.input.blogSearchAutocompleteModel;
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
    },
    onChangeBlog(e) {
      e.attributes.term = '';
      e.attributes.next_offset = 0;
      console.log('[BLOG CHANGE]', e);
      Tumblr.Events.trigger('fox:filterFetch:started', e.attributes);
    },
    setUserList(e) {
      console.log('[SET USERLIST] called', this.get('showUserList'));
      e ? e.preventDefault() : null;
      this.set('showUserList', this.showUserList = !this.showUserList);
    },
    toggleUserList(e) {
      if (e.showUserList) {
        this.input.$el.find('input').attr('placeholder', `Search ${this.model.get('blogname')}`);
        this.input.$el.find('input').val('');
        this.$userList.show();
        this.$settings.hide();
        this.$filters.find('i').hide();
        this.$el.find('.indicator').text('-');
        Tumblr.Fox.Posts.set('tagSearch', 'user');
      } else {
        this.$userList.hide();
        this.$settings.show();
        this.$filters.find('i').show();
        this.$el.find('.indicator').text('+');
      }
    },
    updateLog(response) {
      console.log('[UPDATE LOG]', response);
      this.searchStarted = !1;
      this.model.set(response.loggingData);
      Object.assign(this.filters.model, response.loggingData);
      Object.assign(Tumblr.Fox.Posts.query, response);
    }
  });

  Tumblr.Fox.SearchComponent = SearchComponent;

  return Tumblr.Fox.SearchComponent;
});
