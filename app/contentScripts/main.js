/* global window:true */
/* global module:true */
/* eslint no-undef: "error" */

module.exports = (function main(Tumblr, Backbone, _) {
  window.webpackJsonp(0, [function (module, exports, require) {
    Tumblr.Fox.require = require;
    Tumblr.Fox.Utils.getComponent = Tumblr.Fox.Utils.getComponent.bind(this, Array.prototype.slice.call(arguments));
    Tumblr.Fox.get = Tumblr.Fox.Utils.get;
    Tumblr.Fox.put = Tumblr.Fox.Utils.put;

    const $ = Backbone.$;
    const { Utils } = Tumblr.Fox;
    const { assign } = _;
    const listItems = $('#posts').find('li');
    const attachNode = $(listItems[listItems.length - 1]);
    const formKey = $('#tumblr_form_key').attr('content');

    // cache components
    Utils.getComponent('PrimaComponent', '.uniqueId("component")');
    Utils.getComponent('animation', 'webkitAnimationEnd');
    Utils.getComponent('PopoverMixin', '_crossesView');
    Utils.getComponent('PopoverComponent', 'this._beforeRender'); // this is more like an expanded Backbone view than specifically a popover
    Utils.getComponent('ClickHandler', 'document.addEventListener("click",this._onClick,!0)}');
    Utils.getComponent('NavSearch', 'nav-search');
    Utils.getComponent('PeeprBlogSearch', 'peepr-blog-search');
    Utils.getComponent('SearchResultView', 'inbox-recipients');
    Utils.getComponent('EventBus', '_addEventHandlerByString');
    Utils.getComponent('ConversationsCollection', '/svc/conversations/participant_suggestions');
    Utils.getComponent('Loader', 'this.createBarLoader()');
    Utils.getComponent('InboxCompose', '"inbox-compose"');
    Utils.getComponent('BlogSearch', 'this.onTermSelect');
    Utils.getComponent('Mixin', 'this.mixins=');
    Utils.getComponent('TumblrModel', '.Model.extend({})');
    Utils.getComponent('TumblrView', 'uniqueId("view")');
    // Utils.getComponent('PeeprPostsModel', '/svc/indash_blog/posts');
    Utils.getComponent('AutoComplete', '/svc/search/blog_search_typeahead');
    Utils.getComponent('SearchFiltersTemplate', 'model.showOriginalPostsSwitch');
    Utils.getComponent('SearchFiltersPopover', 'blog-search-filters-popover'); // extend this to get the settings options
    Utils.getComponent('SearchFilters', '[data-filter]');

    assign(Backbone.Model, Tumblr.Fox.get('TumblrModel'));
    // Object.assign(Backbone.View, Tumblr.Fox.get('TumblrView'));

    Tumblr.Fox.constants = {
      attachNode,
      formKey
    };

    if (Tumblr.Fox.options.logging) {
      Tumblr.Fox.Events.start();
    }

    window.require = Tumblr.Fox.require;
    window.getComponent = Tumblr.Fox.getComponent;
  }]);
});
