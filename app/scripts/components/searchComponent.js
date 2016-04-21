module.exports = (function searchComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { bind, debounce, defaults, defer, each, escape, filter, isEmpty } = _;
  const { AutoPaginator, getComponent, require, fetchPostData, filterPosts, renderPosts } = Tumblr.Fox;
  const NavSearch = require(getComponent('nav-search'));
  const PeeprBlogSearch = require(getComponent('peepr-blog-search'));
  const SearchResultView = require(getComponent('inbox-recipients'));
  const EventBus = require(getComponent('_addEventHandlerByString'));
  const ConversationsCollection = require(getComponent('/svc/conversations/participant_suggestions'));
  const InboxCompose = require(getComponent('inbox-compose')[1]);
  const BlogSearch = require(getComponent('/svc/search/blog_search')[0]);
  const filters = require(859);
  const input = require(861);

  let Conversations = new ConversationsCollection();

  const UserSearch = {
    fetchResults(query) {
      console.log('[USER QUERY]', query);
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

  Tumblr.Fox.SearchComponent = PeeprBlogSearch.extend({
    className: 'filter-search',
    template: $('#searchFilterTemplate').html(),
    defaults: {
      showNsfwSwitch: true
    },
    subviews: {
      filters: {
        constructor: filters
      },
      input: {
          constructor: input
      },
      searchResultView: {
        constructor: SearchResultView,
        options: {
          eventBus: new EventBus(), // what is this thing?
          collection: Conversations,
          context: 'input'
        }
      }
    },
    initialize(e) {
      return this.options = Object.assign({}, this.defaults, e),
      this.searchActive = !1,
      this.showUserList = !1,
      this.searchScroll = !1,
      this.normalScroll = !0,
      this.blog = e.blog,
      // this is the crazy filter dropdown
      this.model = new BlogSearch({
        blogname: this.blog.id
      }),
      each(this.subviews, subview => {
        subview.options = subview.options || {},
        subview.options.model = this.model
      }, this),
      console.log(this);
    },
    render() {
      return this.$el.html(this.template);
    },
    afterRenderSubviews() {
      return this.bindEvents(),
      this.$userList = this.searchResultView.$el,
      this.$filters = this.filters.$el,
      this.input.model.set(this.options), // this enables the nsfw filter
      this.input.$el.find('input').attr('data-js-textinput', ''),
      Object.assign(this.input, UserSearch),
      this.set('showUserList', false),
      this
    },
    evalItems(items) {
      console.log('[TAGS]', items);
      if (isEmpty(items)) {
        return this.input.$el.find('input').attr('placeholder', `${this.model.get('blogname')} has no tags`),
        AutoPaginator.reset({ apiFetch: false }),
        Object.assign(AutoPaginator.query, this.input.model.attributes),
        console.log('[AUTOPAGINATOR QUERY]', AutoPaginator.query),
        fetchPostData(this.input.model.attributes, renderPosts);
      }
    },
    toggleScroll() {
      this.searchScroll = !this.searchScroll;
      this.normalScroll = !this.normalScroll;
    },
    selectBlog(e) {
      e.preventDefault();
      const tumblelog = this.$(e.target).parent().find('h3').text();
      return this.model.set('blogname', tumblelog),
      this.model.set(this.input.attributes),
      this.input.blogSearchAutocompleteModel.set('blogname', tumblelog),
      this.input.$el.find('input').attr('placeholder', `Search ${tumblelog}`),
      this.input.$el.find('input').val(''),
      this.input.blogSearchAutocompleteModel.initialize(),
      this.input.blogSearchAutocompleteModel.getItems().then(::this.evalItems),
      this.set('showUserList', this.showUserList = !this.showUserList),
      Tumblr.AutoPaginator.stop();
      // Tumblr.Events.trigger('disable-paginator', true);
    },
    log(e, log, query) {
      if (!AutoPaginator.enabled) {
        Tumblr.AutoPaginator.stop();
        AutoPaginator.reset({ apiFetch: false });
        AutoPaginator.start();
      }
      // Tumblr.Events.trigger('disable-paginator', true);
      this.model.set(query);
      this.model.fetch();
      Object.assign(AutoPaginator.query, query, this.model.attributes);
      console.log('[QUERY SLUG]', this.model, AutoPaginator.query);
    },
    events: {
      'submit .dashboard-search-form': 'formSubmitHandler',
      'click .toggle-user': 'setUserList',
      'click [data-start-conversation]': 'selectBlog',
      'click .post_type_filter': 'onFormClick',
      'click .blog-search-input' : 'onFormClick'
    },
    bindEvents() {
      this.listenTo(this, 'change:showUserList', this.toggleUserList),
      this.listenTo(this, 'change:showUserList', this.delegateInputEvents),
      this.listenTo(this.model, 'change:blogname', filterPosts),
      this.listenTo(this.model.posts, 'reset', ::this.onPostsReset),
      this.listenTo(this.model.posts, 'add', ::this.onPostsAdd),
      this.listenTo(this.model, 'search:reset', ::this.onSearchReset),
      this.listenTo(this.model, 'change:next_offset', ::this.onOffsetChange),
      // this.listenTo(this.model, 'sync', console.log.bind(console, '[SEARCH MODEL]')),
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', bind(this.log, this, 'search-start', {})),
      this.listenTo(Tumblr.Events, 'indashblog:search:fetch-requested', ::this.onFetchRequested),
      this.listenTo(Tumblr.Events, 'indashblog:search:complete', ::this.prepareDashboard),
      this.listenTo(Tumblr.Events, 'peepr-search:search-complete', ::this.updateLog);
    },
    unbindEvents() {
      this.stopListening(Tumblr.Events, 'indashblog:search:complete'),
      this.stopListening(Tumblr.Events, 'peepr-search:search-complete'),
      PeeprBlogSearch.prototype.unbindEvents.call(this);
    },
    delegateInputEvents(e) {
      console.log('[TOGGLE EVENTS]', e.showUserList);
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
    setUserList(e) {
      e.preventDefault();
      this.set('showUserList', this.showUserList = !this.showUserList);
      console.log('[TOGGLE USER]', this.showUserList);
    },
    toggleUserList(e) {
      if (e.showUserList) {
        return this.$userList.show(),
        this.$filters.hide();
      } else {
        return this.$userList.hide(),
        this.$filters.show();
      }
    },
    prepareDashboard(response) {
      console.log('[RESPONSE]', response);
      return AutoPaginator.reset({ apiFetch: false }),
      filterPosts(),
      setTimeout(() => {
        const posts = filter(response, i => { return i.post_html });
        renderPosts(posts);
      }, 400);
    },
    updateLog(response) {
      Object.assign(this.filters.model, response.loggingData),
      Object.assign(AutoPaginator.query, response);
    }
  });

  return Tumblr.Fox;
})
