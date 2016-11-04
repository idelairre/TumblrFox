import { camelCase, extend, forIn, isObject } from 'lodash';
import 'backbone.radio';

// perhaps there is a way to memoize fetched component numbers?

const atTumblr = Backbone.history.location.host === 'www.tumblr.com';

const ComponentFetcher = function (modules) {
  this.initializeWebpackJsonp();

  this.$$componentCache = {};

  if (window.webpackModules) {
    this.modules = window.webpackModules;
    this.require = window.$require;
  }

  this.componentIds = {};
  this.initialize.apply(this);

  if (isObject(modules)) {
    this.getComponents(modules);
  }
};

extend(ComponentFetcher.prototype, Backbone.Events, {
  initialize() {
    this.trigger('initialize:componentFetcher', this);
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
    if (typeof searchTerm === 'undefined') {
      searchTerm = object;
      putFlag = false;
    }
    const results = [];
    for (const key in this.modules) {
      if (this.modules[key].toString().includes(searchTerm) && key !== '0') {
        results.push(key);
      }
    }
    if (results.length === 1 && putFlag) {
      this.put(object, this.require(results[0]));
      this.componentIds[object] = results[0];
    }
    if (results.length === 0) {
      console.error('[FETCHING COMPONENT FAILED]', object);
    }
    return results;
  },
  getComponents(manifest) {
    forIn(manifest, (value, key) => {
      this.getComponent(key, value);
    });
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
  $: 'fn.init',
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
  Poller: 'BasePoller',
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

if (window.location.pathname.match(/search/)) {
  delete manifest.AvatarManager;
}

const componentFetcher = new ComponentFetcher(manifest);

module.exports = componentFetcher;
