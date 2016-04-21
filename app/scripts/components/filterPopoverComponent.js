module.exports = (function filterPopoverComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { debounce } = _;
  const { getComponent, require } = Tumblr.Fox;
  const PrimaComponent = require(getComponent('n.uniqueId("component")'));
  const transition = require(getComponent('webkitAnimationEnd')).transition;
  const mixins = require(211);
  const PopoverComponent = require(getComponent('createCollectionSubviewRenderer')[0]);
  const ClickHandler = require(getComponent('function n(e,t){this.options=s.extend({preventInteraction:!1,ignoreSelectors:[]},t),this._onClick=s.bind(this._onClick,this,e),document.addEventListener("click",this._onClick,!0)}'));
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;
  const { FilterMenuComponent, SearchComponent } = Tumblr.Fox;

  let FilterPopoverComponent = PopoverComponent.extend({
    defaults: {
      preventInteraction: !0,
      toggleUser: false
    },
    mixins: [mixins],
    className: 'popover--filter-popover',
    template: $('#filterPopoverTemplate').html(),
    subviews: {
      filterMenu: {
        constructor: FilterMenuComponent
      },
      searchFilter: {
        constructor: SearchComponent,
        options: {
          blogname: currentUser().id,
          blog: Tumblelog.collection.models[0]
        }
      }
    },
    initialize(e) {
      this.options = Object.assign({}, this.defaults, e);
      return PopoverComponent.prototype.initialize.apply(this, e);
    },
    render() {
      return this.$el.html(this.template),
      this.$pinned.addClass('active'),
      this.$filterPopoverMenu = this.$('.popover_menu'),
      this.$searchBar = this.$('.filter-search'),
      setTimeout(() => {
        this.$filterPopoverMenu.addClass('popover--active'),
        this.bindClickOutside();
      }, 1),
      console.log('[RENDERED COMPONENT]', this),
      this;
    },
    bindClickOutside() {
      const options = {
        preventInteraction: !0,
        ignoreSelectors: ['.popover--blog-search', '.popover_content_wrapper', '.popover_menu_list', '.tumblelog_popover', '.ui_peepr_glass', '.drawer']
      };
      this.clickOutside = new ClickHandler(this.el, options),
      this.clickOutside.on('click:outside', this.hide, this),
      this.clickOutside.on('click:inside', this.hideFilterPopover, this),
      this.listenTo(Tumblr.Events, 'DOMEventor:keyup:escape', this.hide)
    },
    hideFilterPopover(e) {
      const menuItem = $(e.target);
      if (typeof menuItem.data('js-menu-item-link') !== 'undefined') {
        this.hide();
      }
    },
    beforeTeardown() {
      return this.remove(),
      this.$pinned.removeClass('active'),
      this
    },
    unbindClickOutside() {
      this.clickOutside.remove(),
      this.clickOutside = null,
      this.stopListening(Tumblr.Events, 'DOMEventor:keyup:escape');
    },
    hide() {
      this.unbindClickOutside(),
      this.$pinned.removeClass('active'),
      this.$filterPopoverMenu.removeClass('popover--active'),
      transition(this.$el, ::this.afterHide);
    },
    afterHide() {
      this.$el.css({ display: 'none' })
    },
    show() {
      console.log('[FILTER COMPONENT]', this),
      this.bindClickOutside(),
      this.$pinned.addClass('active'),
      this.$el.css({ display: 'block' }),
      setTimeout(() => {
        this.$filterPopoverMenu.addClass('popover--active');
      }, 1);
    }
  })

  Tumblr.Fox.FilterPopoverComponent = FilterPopoverComponent;

  return Tumblr.Fox;
})
