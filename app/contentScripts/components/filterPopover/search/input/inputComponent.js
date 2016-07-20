import { debounce, defaults, extend, pick, template } from 'lodash';
import { ComponentFetcher } from '../../../../utils';
import Events from '../../../../application/events';
import TagSearchAutocompleteModel from './tagSearchAutocompleteModel';

const { BlogSearchAutocompleteHelper, BlogSearchPopover, SearchInput, TagsPopover } = ComponentFetcher.getAll('BlogSearchAutocompleteHelper', 'BlogSearchPopover', 'SearchInput', 'TagsPopover');

const FoxTagsPopover = TagsPopover.extend({
  selectTerm(el) {
    Events.trigger('fox:search:changeTerm', {
      term: el.attr('data-term')
    });
  }
});

const FoxTagsPopoverContainer = BlogSearchPopover.extend({
  className: `${BlogSearchPopover.prototype.className} blog-search-autocomplete-popover`,
  bindEvents() {
    BlogSearchPopover.prototype.bindEvents.apply(this, arguments);
    this.listenTo(this, 'itemSelected', this.subview.selectTerm);
  },
  Subview: FoxTagsPopover
});

const FoxBlogSearchAutocompleteHelper = BlogSearchAutocompleteHelper.extend({
  showPopover() {
    this.model.getItems().then(() => {
      if (!this.popover && this.model.hasMatches()) {
        this.popover = new FoxTagsPopoverContainer({
          pinnedTarget: this.$el,
          model: this.model,
          shift: {
            x: -this.getLeftOffset(),
            y: 0
          },
          preventInteraction: true,
          keycommands: true
        }).render();
        this.listenTo(this.popover, 'close', this.onPopoverClose);
      }
    });
  }
});

const InputComponent = SearchInput.extend({
  initialize(options) {
    Object.assign(this, pick(options, ['conversations', 'model', 'state']));
    SearchInput.prototype.initialize.apply(this);
    this.tagSearchAutocompleteModel = new TagSearchAutocompleteModel({
      state: this.state
    });
    this.conversations.fetchFavorites({
      data: {
       limit: 4
      }
    });
  },
  afterRender() {
    this.blogSearchAutocompleteHelper = new FoxBlogSearchAutocompleteHelper({
      model: this.blogSearchAutocompleteModel,
      el: this.$$('.blog-search-input')
    });
    setTimeout(::this.updateSearchSettings, 0);
    if (this.state.get('disabled')) {
      this.setDisabled();
    }
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
    this.listenTo(Events, 'fox:changeUser', ::this.setUserPlaceholder);
  },
  inputKeyDownHandler(e) {
    if (e.keyCode === 13) {
      this.model.set('term', this.getTerm());
      this.blogSearchAutocompleteModel.set('matchTerm', this.getTerm());
      Events.trigger('fox:search:changeTerm', this.model.toJSON()); // might not need this
    }
  },
  inputBlurHandler() {
    if (this.getTerm() === '') {
      Events.trigger('fox:search:reset');
      return;
    }
    SearchInput.prototype.inputBlurHandler.apply(this, arguments);
  },
  setTerm(term) {
    if (term.length > 0) {
      SearchInput.prototype.setTerm.apply(this, arguments);
    }
  },
  flushTags() {
    const blogname = this.model.get('blogname');
    this.blogSearchAutocompleteHelper.model.set('blogname', blogname);
    this.blogSearchAutocompleteHelper.model.fetch();
  },
  setDisabled() {
    this.undelegateEvents();
    this.stopListening();
  },
  setUserPlaceholder() {
    const placeholder = `Search ${this.model.get('blogname')}`;
    this.$el.find('input').attr('placeholder', placeholder);
  },
  updateSearchSettings() {
    if (this.state.get('user')) {
      this.blogSearchAutocompleteHelper.model = this.blogSearchAutocompleteModel;
      this.setUserPlaceholder();
    } else {
      this.blogSearchAutocompleteHelper.model = this.tagSearchAutocompleteModel;
      this.$el.find('input').attr('placeholder', `Search ${this.state.getState()}`);

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

module.exports = InputComponent;
