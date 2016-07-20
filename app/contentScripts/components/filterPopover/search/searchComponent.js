import $ from 'jquery';
import { assign, each, omit, pick } from 'lodash';
import { ComponentFetcher } from '../../../utils';
import Events from '../../../application/events';
import FiltersComponent from './filters/filtersComponent';
import FiltersDropDownComponent from './filters/filtersDropdownComponent';
import InputComponent from './input/inputComponent';
import SettingsComponent from './settings/settingsComponent';
import LoaderMixin from '../../mixins/loaderMixin';
import PostsModel from '../../posts/postsModel';
import ToggleComponent from '../../popover/toggle/toggle';
import searchTemplate from './searchTemplate.html';

const { EventBus, InboxCompose, PeeprBlogSearch, SearchResultView } = ComponentFetcher.getAll('EventBus', 'InboxCompose', 'PeeprBlogSearch', 'SearchResultView');

/**
*  SearchComponent states:
*    initial load => default user => post model loads unfiltered dashboard posts from tumblr client
*     1. select user (has tags) => post model loads unfiltered blog posts from tumblr client =>
*       a. select tag / filter => post model loads filtered blog posts from tumblr client
*       b. doesn't select tag => post model loads filtered posts from tumblr api
*     2. select user (no tags) => post model loads unfiltered blog posts from tumblr client =>
*       a. (TODO) select filter => post model loads filtered blog posts from tumblr api
*       b. select user (no tags) => select liked posts filter => post model fetches user likes from api
*/

const SearchComponent = PeeprBlogSearch.extend({
  className: 'filter-search',
  template: $(searchTemplate).html(),
  mixins: [LoaderMixin],
  subviews: {
    filters: {
      constructor: FiltersComponent,
      options: opts => {
        return {
          model: opts.model,
          state: opts.state
        };
      }
    },
    input: {
      constructor: InputComponent,
      options: opts => {
        return {
          model: opts.model,
          conversations: opts.conversations,
          state: opts.state,
        };
      }
    },
    searchResultView: {
      constructor: SearchResultView,
      options: opts => {
        return {
          eventBus: opts.eventBus, // what is this thing?
          collection: opts.conversations,
          context: 'input'
        };
      }
    },
    settings: {
      constructor: SettingsComponent,
      options: opts => {
        return {
          state: opts.state,
          isFixedPosition: true,
          autoTeardown: false,
          teardownOnEscape: false
        }
      }
    },
    toggle: {
      constructor: ToggleComponent,
      options: {
        name: 'users'
      }
    }
  },
  initialize(options) {
    Object.assign(this, pick(options, ['model', 'conversations', 'state']));
    this.eventBus = new EventBus();
    this.posts = PostsModel;

    if (typeof this.model !== 'undefined') {
      this.posts.searchModel = this.model;
    }
    if (typeof this.state !== 'undefined') {
      this.posts.state = this.state;
    }
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
    this.$input.find('input').attr('data-js-textinput', ''); // NOTE: DO NOT TOUCH! this allows InboxCompose events to be delegated
    this.set('showUserList', false);
    this.updateSearchSettings(this.state.getState());
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
    this.listenTo(this.model, 'search:reset', ::this.onSearchReset);
    this.listenTo(this.model, 'change:term change:post_type change:sort change:post_role change:before', this.log.bind(this, 'search-start', {}));
    this.listenTo(this.state, 'change:state', ::this.updateSearchSettings);
    this.listenTo(Events, 'fox:search:start', ::this.onFetchRequested);
    this.listenTo(Events, 'fox:search:reset', ::this.resetTerm);
    this.listenTo(Events, 'fox:fetch:complete', ::this.toggleLoading(false));
  },
  unbindEvents() {
    this.stopListening();
  },
  log() {
    // PeeprBlogSearch.prototype.log.apply(this, arguments);
    return this.onFetchRequested();
  },
  onSearchReset() {
    const term = this.model.get('term').length > 0;
    this.$el.toggleClass('term-entered', term);
  },
  resetTerm() {
    this.model.set('term', ''); // NOTE: there is maybe a method apart of the PeeprBlogSearch class that does this
    if (this.model.hasChanged('post_type') || this.model.hasChanged('post_role') || this.model.hasChanged('filter_nsfw')) {
      this.onFetchRequested();
    }
  },
  selectBlog(e) {
    const tumblelog = this.$(e.target).parent().find('h3').text();
    this.model.set('blog', this.input.conversations.where({ name: tumblelog })[0]);
    this.model.set('blogname', tumblelog);
    this.setUserList();
    Events.trigger('fox:changeUser', this.model.get('blogname')); // signals to input component to change its placeholder
    if (this.state.get('dashboard')) {
      this.state.setState('user');
    }
    return this.onFetchRequested();
  },
  onFetchRequested() {
    if (this.loader && this.loader.get('loading')) {
      return;
    }
    if (this.posts.get('loading')) {
      return;
    }
    this.model.set('next_offset', 0);
    this.toggleLoading(true);
    Events.trigger('fox:search:started');
    this.posts.filterPosts().then(() => {
      if (this.model.get('term') && this.model.get('term').length > 0) {
        this.posts.search(this.model.toJSON()).then(() => {
          this.toggleLoading(false);
        });
      } else {
        this.posts.fetch(this.model.toJSON()).then(() => {
          this.toggleLoading(false);
        });
      }
    });
  },
  updateSearchSettings(state) {
    if (state === 'dashboard') {
      if (this.showUserList) {
         this.setUserList();
       }
    } else if (state === 'disabled') {
      const disabled = {
        opacity: '0.5',
        cursor: 'default'
      };
      this.unbindEvents();
      this.toggle.state.set('disabled', true);
      each(this._subviews, subview => {
        subview.undelegateEvents();
        subview.stopListening();
        subview.$el.css(disabled);
      });
      this.input.$el.find('input').css(disabled).addClass('disabled');
    } else if (state === 'user' && Backbone.history.fragment !== 'likes' && Backbone.history.fragment !== 'dashboard') {
      this.$settings.css({
        visibility: 'hidden'
      });
    }
  },
  setUserList(e) {
    if (e) {
      e.preventDefault();
    }
    this.set('showUserList', this.showUserList = !this.showUserList);
    this.toggle.state.set('toggled', this.showUserList);
  },
  toggleUserList(e) {
    this.delegateInputEvents(e);
    if (e.showUserList) {
      this.$userList.show();
      this.$settings.css({
        visibility: 'hidden'
      });
      this.$filters.find('i').hide();
      // if (this.state.get('dashboard')) {
      //   this.state.setState('user');
      // }
    } else {
      this.$userList.hide();
      if (!this.state.get('user') || (this.state.get('user') && (Backbone.history.fragment === 'dashboard' || Backbone.history.fragment === 'likes'))) {
        this.$settings.css({
          visibility: 'visible'
        });
      }
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

module.exports = SearchComponent;
