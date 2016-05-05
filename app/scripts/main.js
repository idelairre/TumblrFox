module.exports = (function main() {
  window.webpackJsonp(0, [function(module, exports, require) {
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

    Tumblr.Fox.options = {
      rendered: false,
      logging: true,
      test: false
    }

    Tumblr.Fox.constants = {
      attachNode: attachNode,
      formKey: formKey
    }

    if (Tumblr.Fox.options.logging) {
      Tumblr.Fox.Events.start();
    }

    Tumblr.Fox.Posts.set('tagSearch', 'user');

    window.fetchPostData = Tumblr.Fox.fetchPostData;
    window.fetchBlogPosts = Tumblr.Fox.fetchBlogPosts;
    window.require = Tumblr.Fox.require;
    window.getComponent = Tumblr.Fox.getComponent;
  }]);
})
