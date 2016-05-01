import autopaginatorComponent from './components/autopaginator/autopaginatorComponent';
import bridge from './utils/bridge';
import componentFetcher from './utils/componentFetcher';
import dashboardAutocompleteModel from './models/dashboardAutocompleteModel';
import filterTemplate from './components/filterPopover/filter/filterTemplate.html';
import filterComponent from './components/filterPopover/filter/filterComponent';
import filterMenuComponent from './components/filterPopover/filterMenu/filterMenuComponent';
import filterMenuTemplate from './components/filterPopover/filterMenu/filterMenuTemplate.html';
import filterPopoverComponent from './components/filterPopover/filterPopoverComponent';
import filterPopoverContainer from './components/filterPopover/filterPopoverContainer';
import filterPopoverTemplate from './components/filterPopover/filterPopoverTemplate.html';
import events from './utils/events';
import icon from '../pages/icon/icon.html';
import postFormatter from './utils/postFormatter';
import postModel from './models/postModel';
import loaderComponent from './components/loader/loaderComponent';
import loaderMixin from './mixins/loaderBar';
import searchComponent from './components/filterPopover/search/searchComponent';
import searchTemplate from './components/filterPopover/search/searchTemplate.html'
import settingsComponent from './components/filterPopover/settings/settingsComponent';
import settingsPopoverTemplate from './components/filterPopover/settings/settingsPopover/settingsPopoverTemplate.html';
import settingsPopoverComponent from './components/filterPopover/settings/settingsPopover/settingsPopoverComponent';
import $ from 'jquery';

// NOTE: reblog follow button is broken

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');
  const accountButton = document.querySelector('#account_button');
  accountButton.insertAdjacentHTML('afterend', icon);
  document.body.insertAdjacentHTML('beforeend', filterTemplate);
  document.body.insertAdjacentHTML('beforeend', filterMenuTemplate);
  document.body.insertAdjacentHTML('beforeend', filterPopoverTemplate);
  document.body.insertAdjacentHTML('beforeend', settingsPopoverTemplate);
  document.body.insertAdjacentHTML('beforeend', searchTemplate);

  bridge.initialize();

  chrome.runtime.sendMessage({ type: 'getCachedLikes' }, response => {
     console.log('[CACHED LIKES]', response.length);
     const slug = new CustomEvent('chrome:cachedLikes', {
       detail: response
     });
     window.dispatchEvent(slug);
  });

  function main() {
    window.webpackJsonp([0], [function(module, exports, require) {
      Tumblr.Fox = Tumblr.Fox || {};
      Tumblr.Fox.require = require;
      Tumblr.Fox.getComponent = Tumblr.Fox.getComponent.bind(this, Array.prototype.slice.call(arguments));

      const $ = Backbone.$;
      const listItems = $('#posts').find('li');
      const attachNode = $(listItems[listItems.length - 1]);
      const formKey = $('#tumblr_form_key').attr('content');

      // cache components
      Tumblr.Fox.getComponent('PrimaComponent', 'n.uniqueId("component")');
      Tumblr.Fox.getComponent('animation', 'webkitAnimationEnd');
      Tumblr.Fox.getComponent('PopoverMixin', '_crossesView');
      Tumblr.Fox.getComponent('PopoverComponent', 'u.mixin.applyTo(d.prototype)');
      Tumblr.Fox.getComponent('ClickHandler', 'function n(e,t){this.options=s.extend({preventInteraction:!1,ignoreSelectors:[]},t),this._onClick=s.bind(this._onClick,this,e),document.addEventListener("click",this._onClick,!0)}');
      Tumblr.Fox.getComponent('NavSearch', 'nav-search');
      Tumblr.Fox.getComponent('PeeprBlogSearch', 'peepr-blog-search');
      Tumblr.Fox.getComponent('SearchResultView', 'inbox-recipients');
      Tumblr.Fox.getComponent('EventBus', '_addEventHandlerByString');
      Tumblr.Fox.getComponent('ConversationsCollection', '/svc/conversations/participant_suggestions');
      Tumblr.Fox.getComponent('Loader', 'this.createBarLoader()');
      Tumblr.Fox.getComponent('InboxCompose', '"inbox-compose"');
      Tumblr.Fox.getComponent('BlogSearch', 'this.onTermSelect');
      Tumblr.Fox.getComponent('mixin', 'this.mixins=u.filter');
      Tumblr.Fox.getComponent('TumblrView', 'this.cid=s.uniqueId("view")');
      Tumblr.Fox.getComponent('AutoComplete', '/svc/search/blog_search_typeahead');
      Tumblr.Fox.getComponent('SearchFiltersTemplate', 'model.showOriginalPostsSwitch');
      Tumblr.Fox.getComponent('SearchFiltersPopover', 'blog-search-filters-popover'); // extend this to get the settings options
      Tumblr.Fox.getComponent('SearchFilters', '[data-filter]');
      Tumblr.Fox.getComponent('PopoverContainer', 'setPinnedTarget(e.pinnedTarget'); // see what the fuck this is

      console.log(Tumblr.Fox.$$componentCache);

      Tumblr.Fox.options = {
        rendered: false,
        logging: true
      }

      Tumblr.Fox.constants = {
        attachNode: attachNode,
        formKey: formKey
      }

      Tumblr.Fox.Posts.set('tagSearch', 'user');

      window.fetchPostData = Tumblr.Fox.fetchPostData;
      window.fetchBlogPosts = Tumblr.Fox.fetchBlogPosts;
      window.require = Tumblr.Fox.require;
      window.getComponent = Tumblr.Fox.getComponent;
    }]);
  }

  function inject(modules) {
    for (let i = 0; modules.length > i; i += 1) {
      const module = modules[i];
      const app = document.createElement('script');
      app.appendChild(document.createTextNode('(' + module + ')();'));
      (document.body || document.head || document.documentElement).appendChild(app);
    }
  }

  inject([postModel, postFormatter, componentFetcher, events, autopaginatorComponent, loaderComponent, main, loaderMixin, dashboardAutocompleteModel, filterComponent, settingsPopoverComponent, settingsComponent, searchComponent, filterMenuComponent, filterPopoverComponent, filterPopoverContainer]);
}
