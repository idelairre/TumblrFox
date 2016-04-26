module.exports = (function filterPopoverComponent() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { debounce } = _;
  const { get, FilterMenuComponent, SearchComponent } = Tumblr.Fox;
  const PrimaComponent = get('PrimaComponent');
  const transition = get('animation').transition;
  const popover = get('PopoverMixin');
  const PopoverComponent = get('PopoverComponent');
  const ClickHandler = get('ClickHandler');
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;

  let FilterPopoverComponent = PopoverComponent.extend({
    className: 'popover--filter-popover',
    defaults: {
      preventInteraction: !0,
      toggleUser: !1
    },
    mixins: [popover],
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
      return this.options = Object.assign({}, this.defaults, e),
      PopoverComponent.prototype.initialize.apply(this, e);
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
