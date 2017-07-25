import { camelCase, extend } from 'lodash';
import chromeTrigger from './chromeTrigger';
import constants from '../application/constants';

// perhaps there is a way to memoize fetched component numbers?

const atTumblr = Backbone.history.location.host === 'www.tumblr.com';

const ComponentFetcher = function (modules) {
  this.initializeWebpackJsonp();

  this.$$componentCache = {};

  if (window.webpackModules) {
    this.modules = window.webpackModules;
    this.require = window.$require;
  }

  this.componentIds = constants.componentIds || {};
  this.initialize.apply(this);

  this.getComponents(modules);
};

extend(ComponentFetcher.prototype, Backbone.Events, {
  initialize() {
    this.trigger('initialize:componentFetcher', this);
    this.listenTo(this, 'initialize:components:done', () => {
      chromeTrigger('chrome:initialize:constants', {
        componentIds: this.componentIds
      });
    });
  },
  initializeWebpackJsonp() {
    if (window.webpackJsonp) {
      window.webpackJsonp([0], [function (module, exports, tumblrRequire) {
        const args = Array.from(arguments);
        window.webpackModules = args[2].m;
        window.$require = tumblrRequire;
      }]);
    }
  },
  getComponent(object, searchTerm) {
    let putFlag = true;
    let result;

    if (typeof searchTerm === 'undefined') {
      searchTerm = object;
      putFlag = false;
      result = [];
    }

    for (const key in this.modules) {
      if (this.modules[key].toString().includes(searchTerm) && key !== '0') {
        if (!putFlag) { // we're searching and possibly expect multiple results
          result.push(key);
        } else { // we're trying to actually fetch a component
          result = key;
        }
      }
    }

    if (putFlag) {
      this.put(object, this.require(result));
      this.componentIds[object] = result;
    }

    if (!result) {
      console.error('[FETCHING COMPONENT FAILED]', object);
    }

    return result;
  },
  getComponents(manifest) {
    for (const key in manifest) {
      this.getComponent(key, manifest[key]);
    }

    this.trigger('initialize:components:done');
  },
  getId(name) {
    if (this.componentIds[name]) {
      return this.componentIds[name];
    } else {
      throw new Error(`Component "${name}" not found`);
    }
  },
  asyncGet(componentName) {
    const deferred = $.Deferred();

    if (typeof this.$$componentCache[componentName] === 'undefined') {
      Tumblr.Fox.once(`initialize:dependency:${componentName}`, component => {
        deferred.resolve(component);
      });
    } else {
      deferred.resolve(this.$$componentCache[componentName]);
    }
    return deferred.promise();
  },
  get(componentName) {
    if (typeof this.$$componentCache[componentName] === 'undefined') {
      throw new Error(`Component "${componentName}" not found or not yet loaded`);
    }
    return this.$$componentCache[componentName];
  },
  getAll(componentArray) {
    if (!Array.isArray(componentArray)) {
      componentArray = Array.from(arguments);
    }

    const response = {};

    componentArray.map(component => {
      if (typeof this.$$componentCache[component] === 'undefined') {
        throw new Error(`Component "${component}" in "${componentArray}" not found or not yet loaded`);
      } else {
        response[component] = this.$$componentCache[component];
      }
    });
    return response;
  },
  put(name, component) {
    this.$$componentCache[name] = component;
    this.trigger('initialize:components:add', name, this.$$componentCache[name]);
  }
});

const manifest = atTumblr ? {
  AutoComplete: '/svc/search/blog_search_typeahead',
  AvatarManager: '$postContainer',
  animation: 'webkitAnimationEnd',
  BlogSearch: 'this.onTermSelect',
  BlogSearchAutocompleteHelper: 'this.model.hasMatches()',
  BlogSearchPopover: 'popover--blog-search',
  ConversationsCollection: '/svc/conversations/participant_suggestions',
  ClickHandler: 'document.addEventListener("click",this._onClick,!0)}',
  EventBus: '_addEventHandlerByString',
  InboxCompose: '"inbox-compose"',
  PrimaComponent: '.uniqueId("component")',
  PopoverMixin:  '_crossesView',
  PeeprBlogSearch: 'peepr-blog-search',
  SearchResultView: 'inbox-recipients',
  KeyCommandsMixin: '__keyFn',
  Loader: 'this.createBarLoader()',
  Mixin: 'this.mixins=',
  moment: 'MM/DD/YYYY',
  SearchFilters: '[data-filter]',
  SearchFiltersPopover: 'blog-search-filters-popover',
  SearchInput: '$$(".blog-search-input")',
  TagsPopover: 'click [data-term]',
  TumblrModel: '.Model.extend({})',
  TumblrView: 'this._beforeRender'
} : {};

if (window.location.pathname.match(/search/) || window.location.pathname.match(/explore/)) {
  delete manifest.AvatarManager;
}

const componentFetcher = new ComponentFetcher(manifest);

module.exports = componentFetcher;
