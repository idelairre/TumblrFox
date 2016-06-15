module.exports = (function (Tumblr, Backbone, _) {
  const { assign, debounce, pick } = _;
  const { get, Utils } = Tumblr.Fox;
  const { ComponentFetcher } = Utils;
  const SearchInput = get('SearchInput');

  const InputComponent = SearchInput.extend({
    initialize(options) {
      assign(this, pick(options, ['conversations', 'model', 'searchOptions', 'state']));
      SearchInput.prototype.initialize.apply(this);
      const { TagSearchAutocompleteModel, TextSearchAutocompleteModel } = ComponentFetcher.getAll('TagSearchAutocompleteModel', 'TextSearchAutocompleteModel');
      this.tagSearchAutocompleteModel = new TagSearchAutocompleteModel({
        state: options.state
      });
      this.textSearchAutocompleteModel = new TextSearchAutocompleteModel({
        state: options.state
      });
      this.conversations.fetchFavorites({
        data: {
         limit: 4
        }
      });
      setTimeout(() => {
        this.updateSearchSettings();
      }, 0);
    },
    events: {
      'blur .blog-search-input': 'inputBlurHandler',
      'focus .blog-search-input': 'inputFocusHandler',
      'keyup .blog-search-input': 'inputKeyUpHandler',
      'keydown .blog-search-input': 'inputKeyDownHandler'
    },
    bindEvents() {
      this.listenTo(this.model, 'change:blogname', ::this.flushTags);
      this.listenTo(this.model, 'change:term', ::this.onTermChange);
      this.listenTo(this.model, 'reset', ::this.onModelReset);
      this.listenTo(this.state, 'change:state', ::this.updateSearchSettings);
      this.listenTo(Tumblr.Events, 'fox:changeUser', ::this.setUserPlaceholder);
      this.listenTo(this.searchOptions, 'change:state', ::this.delegateInputEvents);
    },
    delegateInputEvents(state) { // NOTE: turns off tag popover while backend is being sorted out
      switch (state) {
        case 'tag':
          this.blogSearchAutocompleteHelper.delegateEvents();
          this.blogSearchAutocompleteHelper.bindEvents();
          break;
        case 'text':
          this.blogSearchAutocompleteHelper.undelegateEvents();
          this.blogSearchAutocompleteHelper.stopListening();
          break;
      }
    },
    inputKeyDownHandler(e) {
      if (e.keyCode === 13) {
        this.model.set('term', this.getTerm());
        this.blogSearchAutocompleteModel.set('matchTerm', this.getTerm());
        Tumblr.Events.trigger('peeprsearch:change:term', this.model.attributes);
      }
    },
    inputBlurHandler() {
      if (this.getTerm() === '') {
        Tumblr.Events.trigger('peepr-search:search-reset');
      }
      SearchInput.prototype.inputBlurHandler.apply(this, arguments);
    },
    flushTags() {
      const blogname = this.model.get('blogname');
      this.blogSearchAutocompleteHelper.model.set('blogname', blogname);
      this.blogSearchAutocompleteHelper.model.fetch();
    },
    setUserPlaceholder() {
      const placeholder = `Search ${this.model.get('blogname')}`;
      this.$el.find('input').attr('placeholder', placeholder);
    },
    updateSearchSettings() {
      if (Tumblr.Fox.state.getState() === 'user') {
        this.blogSearchAutocompleteHelper.model = this.blogSearchAutocompleteModel;
        this.setUserPlaceholder();
      } else {
        this.blogSearchAutocompleteHelper.model = (Tumblr.Fox.searchOptions.get('tag') ? this.tagSearchAutocompleteModel : this.textSearchAutocompleteModel);
        this.$el.find('input').attr('placeholder', `Search ${Tumblr.Fox.state.getState()}`);
      }
    },
    fetchResults(query) {
      return this.conversations.fetch({
        data: {
          q: query,
          limit: 5
        }
      });
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
  });

  // extend(InputComponent, SearchInput);

  Tumblr.Fox.register('InputComponent', InputComponent);
});
