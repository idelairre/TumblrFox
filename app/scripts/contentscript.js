import autopaginatorComponent from './components/autopaginator/autopaginatorComponent';
import componentFetcher from './utils/componentFetcher';
import filterMenuComponent from './components/filterPopover/filterMenu/filterMenuComponent';
import filterMenuTemplate from './components/filterPopover/filterMenu/filterMenuTemplate.html';
import filterPopoverComponent from './components/filterPopover/filterPopoverComponent';
import filterPopoverContainer from './components/filterPopover/filterPopoverContainer';
import filterPopoverTemplate from './components/filterPopover/filterPopoverTemplate.html';
import events from './utils/events';
import icon from '../pages/icon/icon.html';
import postFormatter from './utils/postFormatter';
import postFetcher from './utils/postFetcher';
import loaderComponent from './components/loader/loaderComponent';
import loaderMixin from './mixins/loaderBar';
import searchComponent from './components/filterPopover/search/searchComponent';
import searchTemplate from './components/filterPopover/search/searchTemplate.html'
import settingsIcon from './components/filterPopover/settings/settingsIcon/settingsIconComponent';
import settingsPopoverTemplate from './components/filterPopover/settings/settingsPopover/settingsPopoverTemplate.html';
import settingsPopoverComponent from './components/filterPopover/settings/settingsPopover/settingsPopoverComponent';

// get user search component to still search if there are no tags
// NOTE: reblog follow button is broken

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');
  const accountButton = document.querySelector('#account_button');
  accountButton.insertAdjacentHTML('afterend', icon);
  document.body.insertAdjacentHTML('beforeend', filterMenuTemplate);
  document.body.insertAdjacentHTML('beforeend', filterPopoverTemplate);
  document.body.insertAdjacentHTML('beforeend', settingsPopoverTemplate);
  document.body.insertAdjacentHTML('beforeend', searchTemplate);

  window.addEventListener('chrome:fetch:blogPosts', e => {
    chrome.runtime.sendMessage({ fetchBlogPosts: e.detail }, response => {
      const slug = new CustomEvent('chrome:response:posts', { detail: response });
      window.dispatchEvent(slug);
    });
  });

  window.addEventListener('chrome:fetch:posts', e => {
    chrome.runtime.sendMessage({ fetchPosts: e.detail }, response => {
      const slug = new CustomEvent('chrome:response:posts', { detail: response });
      window.dispatchEvent(slug);
    });
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

      console.log(Tumblr.Fox.$$componentCache);

      Tumblr.Fox.options = {
        rendered: false,
        logging: true
      }

      Tumblr.Fox.constants = {
        attachNode: attachNode,
        formKey: formKey
      }

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

  inject([postFetcher, postFormatter, componentFetcher, events, autopaginatorComponent, loaderComponent, main, loaderMixin, settingsPopoverComponent, settingsIcon, searchComponent, filterMenuComponent, filterPopoverComponent, filterPopoverContainer]);
}
