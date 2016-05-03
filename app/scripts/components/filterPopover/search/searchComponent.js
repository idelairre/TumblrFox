module.exports = (function searchComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { after, bind, clone, debounce, each, isEmpty } = _;
  const { AutoPaginator, get, fetchPostData, filterPosts, renderPosts, loaderMixin, DashboardSearchAutocompleteModel, Filters, Posts, Settings } = Tumblr.Fox;
  const NavSearch = get('NavSearch');
  const PeeprBlogSearch = get('PeeprBlogSearch');
  const SearchResultView = get('SearchResultView');
  const SearchFilters = get('SearchFilters');
  const EventBus = get('EventBus');
  const ConversationsCollection = get('ConversationsCollection');
  const InboxCompose = get('InboxCompose');
  const BlogSearch = get('BlogSearch');
  const AutocompleteSearch = get('AutoComplete');

  let Conversations = new ConversationsCollection();

  // TODO: handle if there are no results in the tag search, i.e., if the next offset is -1

  // states: initial load => default user => autopaginator loads unfiltered dashboard posts from tumblr client
  //         select user (has tags) => autopaginator loads unfiltered blog posts from tumblr client
  //            select tag / filter => autopaginator loads filtered blog posts from tumblr client
  //            no tag => autopaginator loads filtered posts from tumblr api
  //         select user (no tags) => autopaginator loads unfiltered blog posts from tumblr client
  //            select filter => autopaginator loads filtered blog posts from tumblr api

  // expand input to include a dashboard search

  const defaultFilter = clone(PeeprBlogSearch.prototype.subviews.filters.constructor.prototype);

  const InputExtension = {
    dashboardSearchAutocompleteModel: DashboardSearchAutocompleteModel,
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
  }

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
  }

  Tumblr.Fox.SearchComponent = PeeprBlogSearch.extend({
    className: 'filter-search',
    template: $('#searchFilterTemplate').html(),
    mixins: [loaderMixin],
    defaults: {
      state: {
        dashboardSearch: !1,
        userSearch: !0,
        likesSearch: !0
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
      return this.options = Object.assign({}, this.defaults, e),
      this.state = this.defaults.state,
      this.searchActive = !1,
      this.blog = e.blog,
      // this is the crazy filter dropdown
      this.model = new BlogSearch({
        blogname: this.blog.id
      }),
      this.setState('user'),
      this.initializeSubviews();
    },
    initializeSubviews() {
      Object.assign(this.subviews.filters.constructor.prototype, FiltersPopover),
      each(this.subviews, subview => {
        subview.options = subview.options || {},
        subview.options.model = this.model
      }, this);
    },
    render() {
      return this.$el.html(this.template);
    },
    afterRenderSubviews() {
      return this.$userList = this.searchResultView.$el,
      this.$filters = this.filters.$el,
      this.$settings = this.settings.$el,
      this.input.model.set(this.options), // this enables the nsfw filter
      this.input.$el.find('input').attr('data-js-textinput', ''),
      Object.assign(this.input, InputExtension),
      this.bindEvents(),
      this.set('showUserList', false),
      this;
    },
    evalItems(data) {
      console.log('[TAGS]', data);
      if (isEmpty(data.tags)) {
        this.input.blogSearchAutocompleteModel.items.reset([]);
        this.input.$el.find('input').attr('placeholder', `${this.model.get('blogname')} has no tags`);
      }
    },
    selectBlog(e) {
      e.preventDefault();
      const tumblelog = this.$(e.target).parent().find('h3').text();
      return this.model.set('blogname', tumblelog),
      this.input.blogSearchAutocompleteModel.set('blogname', tumblelog),
      this.input.$el.find('input').attr('placeholder', `Search ${tumblelog}`),
      this.input.$el.find('input').val(''),
      this.input.blogSearchAutocompleteModel.fetch().then(this.evalItems),
      this.set('showUserList', this.showUserList = !this.showUserList),
      this.setState('userSearch'),
      Posts.state.apiFetch = !1,
      Tumblr.AutoPaginator.stop();
    },
    log(query) {
      if (query === 'search-complete' || this.model.previous('term') === query.term) {
        this.toggleLoader(false);
        return;
      }
      if (this.state.likesSearch) {
        console.log('[LIKES SEARCH]', query),
        this.toggleLoader(true),
        Posts.searchLikes(query.term).then(() => {
          this.toggleLoader(false);
        });
        return;
      }
      return this.toggleLoader(true),
      this.searchStarted = !0,
      this.model.set(query),
      this.model.fetch();
    },
    events: {
      'submit .dashboard-search-form': 'formSubmitHandler',
      'click .toggle-user': 'setUserList',
      'click [data-start-conversation]': 'selectBlog',
      'click .post_type_filter': 'onFormClick',
      'click .blog-search-input' : 'onFormClick'
    },
    bindEvents() {
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
      this.listenTo(this.model, 'change', console.log.bind(console, '[FILTER]'));
    },
    unbindEvents() {
      this.stopListening(this.filters.model, 'change', this.setAttributes);
      this.stopListening(this, 'change:showUserList', this.toggleUserList);
      this.stopListening(this, 'change:showUserList', this.delegateInputEvents);
      this.stopListening(Tumblr.Events, 'indashblog:search:complete');
      this.stopListening(Tumblr.Events, 'peepr-search:search-complete');
      PeeprBlogSearch.prototype.unbindEvents.call(this);
    },
    setState(state) {
      for (let key in this.state) {
        this.state[key] = !1;
        if (key.includes(state)) {
          this.state[key] = !0;
        }
      }
    },
    updateSearchSettings(state) {
      console.log('[UPDATE SEARCH SETTINGS] called', this);
      this.setState(state);
      if (state === 'dashboard') {
        this.showUserList ? this.setUserList() : null;
        this.input.$el.find('input').attr('placeholder', 'Search dashboard'),
        this.input.$el.find('input').val('');
      } else if (state === 'likes') {
        this.input.$el.find('input').attr('placeholder', 'Search likes'),
        this.input.$el.find('input').val(''),
        this.input.blogSearchAutocompleteHelper.model = this.input.dashboardSearchAutocompleteModel,
        this.input.blogSearchAutocompleteHelper.model.fetch();
      } else {
        this.input.$el.find('input').attr('placeholder', `Search ${this.model.get('blogname')}`),
        this.input.$el.find('input').val(''),
        this.input.blogSearchAutocompleteHelper.model = this.input.blogSearchAutocompleteModel;
      }
    },
    delegateInputEvents(e) {
      if (e.showUserList) {
        this.input.undelegateEvents(),
        this.filters.undelegateEvents(),
        this.input.blogSearchAutocompleteHelper.undelegateEvents(),
        this.input.delegateEvents(InboxCompose.prototype.events),
        this.searchResultView.delegateEvents();
      } else {
        this.input.undelegateEvents(),
        this.input.delegateEvents(),
        this.filters.delegateEvents(),
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
      e ? e.preventDefault() : null;
      this.set('showUserList', this.showUserList = !this.showUserList);
    },
    toggleUserList(e) {
      if (e.showUserList) {
        return Tumblr.Fox.Posts.set('tagSearch', 'user'),
        this.input.$el.find('input').attr('placeholder', `Search ${this.model.get('blogname')}`),
        this.input.$el.find('input').val(''),
        this.$userList.show(),
        this.$settings.hide(),
        this.$filters.find('i').hide(),
        this.$el.find('.indicator').text('-');
      } else {
        return this.$userList.hide(),
        this.$settings.show(),
        this.$filters.find('i').show(),
        this.$el.find('.indicator').text('+');
      }
    },
    updateLog(response) {
      console.log('[UPDATE LOG]', response);
      this.searchStarted = !1,
      Object.assign(this.filters.model, response.loggingData),
      Object.assign(Tumblr.Fox.Posts.query, response);
    }
  });

  return Tumblr;
})
