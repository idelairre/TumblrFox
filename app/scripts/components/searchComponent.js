module.exports = (function searchComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { after, bind, debounce, each, isEmpty } = _;
  const { AutoPaginator, getComponent, require, fetchPostData, filterPosts, renderPosts } = Tumblr.Fox;
  const NavSearch = require(getComponent('NavSearch', 'nav-search'));
  const PeeprBlogSearch = require(getComponent('PeeprBlogSearch', 'peepr-blog-search'));
  const SearchResultView = require(getComponent('SearchResultView', 'inbox-recipients'));
  const EventBus = require(getComponent('EventBus', '_addEventHandlerByString'));
  const ConversationsCollection = require(getComponent('ConversationsCollection', '/svc/conversations/participant_suggestions'));
  const InboxCompose = require(getComponent('InboxCompose', 'inbox-compose')[1]);
  const BlogSearch = require(getComponent('BlogSearch', '/svc/search/blog_search')[0]);
  const Loader = require(getComponent('Loader', 'this.createBarLoader()'))

  let Conversations = new ConversationsCollection();

  // NOTE: this component has three states
  // 1. search state
  // 2. user select
  // 3. search state with no results/presearch -- this sets default autoscroll behavior which just pulls posts from the blog without a filter

  // TODO: handle conditions
  // if there are no results in the tag search, i.e., if the next offset is -1

  const UserSearch = {
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

  Tumblr.Fox.SearchComponent = PeeprBlogSearch.extend({
    className: 'filter-search',
    template: $('#searchFilterTemplate').html(),
    defaults: {
      showNsfwSwitch: !0
    },
    subviews: Object.assign(PeeprBlogSearch.prototype.subviews, {
      searchResultView: {
        constructor: SearchResultView,
        options: {
          eventBus: new EventBus(), // what is this thing?
          collection: Conversations,
          context: 'input'
        }
      }
    }),
    initialize(e) {
      return this.options = Object.assign({}, this.defaults, e),
      this.searchActive = !1,
      this.showUserList = !1,
      this.blog = e.blog,
      // this is the crazy filter dropdown
      this.model = new BlogSearch({
        blogname: this.blog.id
      }),
      each(this.subviews, subview => {
        subview.options = subview.options || {},
        subview.options.model = this.model
      }, this)
    },
    render() {
      return this.$el.html(this.template);
    },
    afterRenderSubviews() {
      return this.$userList = this.searchResultView.$el,
      this.$filters = this.filters.$el,
      this.input.model.set(this.options), // this enables the nsfw filter
      this.input.$el.find('input').attr('data-js-textinput', ''),
      Object.assign(this.input, UserSearch),
      this.bindEvents(),
      this.set('showUserList', false),
      this.initialized = !0,
      this
    },
    evalItems(items) {
      if (isEmpty(items)) {
        return this.input.$el.find('input').attr('placeholder', `${this.model.get('blogname')} has no tags`);
      }
    },
    toggleLoader(e) {
      // console.log('[TOGGLE LOADER]', e);
      e === !0 ? this.loader ? this.loader.set('loading', !0) : this.loader = new Loader({
          $container: this.$el,
          type: 'bar',
          classModifiers: 'top',
          loading: !0
      }) : this.loader.set('loading', !1)
    },
    evalFilter(e) { // broken, having trouble getting this to fire without clobbering tag search events
      console.log(e, this.model);
      if (!this.searchStarted && e.term === '') {
        Tumblr.Events.trigger('fox:filter:fetch', e.attributes);
      }
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
    },
    log(e, log, query) {
      e === 'search-start' ? this.toggleLoader(true) : this.toggleLoader(false);
      if (!AutoPaginator.enabled) {
        Tumblr.AutoPaginator.stop(),
        AutoPaginator.reset({ apiFetch: false }),
        AutoPaginator.start()
      }
      return this.searchStarted = !0,
      this.model.set(query),
      this.model.fetch(),
      Object.assign(AutoPaginator.query, query, this.model.attributes);
      // console.log('[QUERY SLUG]', e, this.model, AutoPaginator.query);
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
      this.listenTo(this.model, 'change:blogname', after(1, this.onChangeBlog)), // reset term, fetch new posts
      this.listenTo(this.model.posts, 'reset', ::this.onPostsReset),
      this.listenTo(this.model.posts, 'add', ::this.onPostsAdd),
      this.listenTo(this.model, 'search:reset', ::this.onSearchReset),
      this.listenTo(this.model, 'change:next_offset', ::this.onOffsetChange),
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', bind(this.log, this, 'search-start', {})),
      this.listenTo(Tumblr.Events, 'indashblog:search:fetch-requested', ::this.onFetchRequested),
      this.listenTo(Tumblr.Events, 'peepr-search:search-complete', ::this.updateLog);
      // this.listenTo(this.filters.model, 'change', after(2, this.evalFilter)); // if the attribute is not blog name, fetch posts
    },
    unbindEvents() {
      this.stopListening(this.filters.model, 'change', this.setAttributes),
      this.stopListening(this, 'change:showUserList', this.toggleUserList),
      this.stopListening(this, 'change:showUserList', this.delegateInputEvents),
      this.stopListening(Tumblr.Events, 'indashblog:search:complete'),
      this.stopListening(Tumblr.Events, 'peepr-search:search-complete'),
      PeeprBlogSearch.prototype.unbindEvents.call(this);
    },
    delegateInputEvents(e) {
      // console.log('[TOGGLE EVENTS]', e.showUserList);
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
      e.term = '';
      Tumblr.Events.trigger('fox:filter:blogSelected', e.attributes);
    },
    setUserList(e) {
      e.preventDefault();
      this.set('showUserList', this.showUserList = !this.showUserList);
    },
    toggleUserList(e) {
      if (e.showUserList) {
        return this.$userList.show(),
        this.$filters.hide(),
        this.$el.find('.indicator').text('-');
      } else {
        return this.$userList.hide(),
        this.$filters.show(),
        this.$el.find('.indicator').text('+');
      }
    },
    updateLog(response) {
      console.log('[UPDATE LOG]', response);
      this.searchStarted = !1,
      Object.assign(this.filters.model, response.loggingData),
      Object.assign(AutoPaginator.query, response);
    }
  });

  return Tumblr.Fox;
})
