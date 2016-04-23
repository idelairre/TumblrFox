import autopaginatorComponent from './components/autopaginatorComponent';
import componentFetcher from './utils/componentFetcher';
import filterMenuComponent from './components/filterMenuComponent';
import filterPopoverComponent from './components/filterPopoverComponent';
import filterPopoverContainer from './components/filterPopoverContainer';
import events from './utils/events';
import icon from '../pages/icon/icon.html';
import popover from '../pages/popover/popover.html';
import postFormatter from './utils/postFormatter';
import postFetcher from './utils/postFetcher';
import loaderComponent from './components/loaderComponent';
import searchComponent from './components/searchComponent';

// get user search component to still search if there are no tags
// NOTE: reblog follow button is broken

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');
  const accountButton = document.querySelector('#account_button');
  accountButton.insertAdjacentHTML('afterend', icon);
  document.body.insertAdjacentHTML('beforeend', popover);

  window.addEventListener('chrome:fetch:posts', e => {
    // console.log('[FETCH POSTS]', e.detail);
    chrome.runtime.sendMessage({ fetchPost: e.detail }, response => {
      const slug = new CustomEvent('chrome:response:posts', { detail: response });
      window.dispatchEvent(slug);
    });
  });

  function main() {
    window.webpackJsonp([0], [function(module, exports, __webpack_require__) {
      Tumblr.Fox = Tumblr.Fox || {};
      Tumblr.Fox.require = __webpack_require__;
      Tumblr.Fox.getComponent = Tumblr.Fox.getComponent.bind(this, Array.prototype.slice.call(arguments));

      const $ = Backbone.$;
      const listItems = $('#posts').find('li');
      const attachNode = $(listItems[listItems.length - 1]);
      const formKey = $('#tumblr_form_key').attr('content');

      Tumblr.Fox.options = {
        rendered: false,
        logging: true
      }

      Tumblr.Fox.constants = {
        attachNode: attachNode,
        formKey: formKey
      }

      window.fetchPostData = Tumblr.Fox.fetchPostData;
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

  inject([postFetcher, postFormatter, componentFetcher, events, autopaginatorComponent, loaderComponent, main, searchComponent, filterMenuComponent, filterPopoverComponent, filterPopoverContainer]);
}
