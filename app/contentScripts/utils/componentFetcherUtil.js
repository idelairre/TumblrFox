import { camelCase, extend, forIn, isArray, isObject } from 'lodash';
import 'backbone.radio';

// perhaps there is a way to memoize fetched component numbers?

const optionsChannel = Backbone.Radio.channel('options');

const ComponentFetcher = function (modules) {
  this.initializeWebpackJsonp();

  this.$$componentCache = {};
  this.modules = window.webpackModules;
  this.require = window.$require;
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
    window.webpackJsonp([0], [function (module, exports, tumblrRequire) {
      const args = Array.prototype.slice.call(arguments);
      window.webpackModules = args[2].m;
      window.$require = tumblrRequire;
    }]);
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
    if (optionsChannel.request('fox:getOptions')) {
      console.log('[FETCHING COMPONENT]', object, results);
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
    if (!isArray(componentArray)) {
      componentArray = Array.prototype.slice.call(arguments);
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

const componentFetcher =  new ComponentFetcher({
  $: 'fn.init',
  Backbone: '1.2.3',
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
  SearchFilters: '[data-filter]',
  SearchFiltersPopover: 'blog-search-filters-popover',
  SearchInput: '$$(".blog-search-input")',
  TagsPopover: 'click [data-term]',
  TumblrModel: '.Model.extend({})',
  TumblrView: 'this._beforeRender'
});

module.exports = componentFetcher;
