/* global window:true */
/* global module:true */
/* eslint no-undef: "error" */

module.exports = (function main(Tumblr, Backbone, _) {
  const { ComponentFetcher } = Tumblr.Fox.Utils;
  const { require } = Tumblr.Fox;
  const { extend } = _;

  ComponentFetcher.getComponent('PrimaComponent', '.uniqueId("component")');
  ComponentFetcher.getComponent('animation', 'webkitAnimationEnd');
  ComponentFetcher.getComponent('PopoverMixin', '_crossesView');
  ComponentFetcher.getComponent('TumblrView', 'this._beforeRender'); // this is more like an expanded Backbone view than specifically a popover
  ComponentFetcher.getComponent('ClickHandler', 'document.addEventListener("click",this._onClick,!0)}');
  ComponentFetcher.getComponent('NavSearch', 'nav-search');
  ComponentFetcher.getComponent('PeeprBlogSearch', 'peepr-blog-search');
  ComponentFetcher.getComponent('SearchResultView', 'inbox-recipients');
  ComponentFetcher.getComponent('EventBus', '_addEventHandlerByString');
  ComponentFetcher.getComponent('ConversationsCollection', '/svc/conversations/participant_suggestions');
  ComponentFetcher.getComponent('Loader', 'this.createBarLoader()');
  ComponentFetcher.getComponent('InboxCompose', '"inbox-compose"');
  ComponentFetcher.getComponent('BlogSearch', 'this.onTermSelect');
  ComponentFetcher.getComponent('Mixin', 'this.mixins=');
  ComponentFetcher.getComponent('TumblrModel', '.Model.extend({})');
  ComponentFetcher.getComponent('PeeprPostsModel', 'bindBlogSearchEvents');
  ComponentFetcher.getComponent('AutoComplete', '/svc/search/blog_search_typeahead');
  ComponentFetcher.getComponent('SearchFiltersTemplate', 'model.showOriginalPostsSwitch');
  ComponentFetcher.getComponent('SearchFiltersPopover', 'blog-search-filters-popover'); // extend this to get the settings options
  ComponentFetcher.getComponent('SearchFilters', '[data-filter]');
  ComponentFetcher.getComponent('SearchInput', '$$(".blog-search-input")');

  extend(Backbone.Model, ComponentFetcher.get('TumblrModel'));

  Tumblr.Fox.trigger('fox:components:ready');

});
