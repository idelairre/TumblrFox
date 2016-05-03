module.exports = (function filters() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { defaults, mapKeys } = _;
  const { get } = Tumblr.Fox;
  const SearchFiltersPopover = get('SearchFiltersPopover');
  const SearchFilters = get('SearchFilters');
  const transition = get('animation').transition;
  const ClickHandler = get('ClickHandler');
  const PopoverComponent = get('PopoverComponent');
  const popover = get('PopoverMixin');

  let FilterComponent = PopoverComponent.extend({
    className: 'popover--blog-search blog-search-filters-popover',
    mixins: Object.assign([popover], SearchFiltersPopover.prototype.mixins),
    template: $('#filterTemplate').html(),
    events: SearchFilters.prototype.events,
    initialize(e) {
      mapKeys(SearchFilters.prototype, (val, key) => {
        if (typeof val === 'function' && key !== 'template' && key !== 'render' && key !== 'initialize' && key !== 'bindEvents') {
          this[key] = val;
        }
      }),
      this.bindEvents();
    },
    render() {
      return this.$el.html(this.template),
      this.$main = this.$('.popover_menu'),
      setTimeout(::this.setActiveAndBindEvents, 1),
      this;
    },
    bindEvents() {
      SearchFilters.prototype.bindEvents.apply(this);
    },
    bindClickOutside() {
      this._popoverBase.autoTeardown && (this.clickOutside = new ClickHandler(this.el),
      this.clickOutside.on('click:outside', this.hide, this));
    },
    hide() {
      this.unbindClickOutside(),
      this.$main.removeClass('popover--active'),
      transition(this.$el, ::this.afterHide);
    },
    afterHide() {
      this.teardown(),
      this.remove();
    },
    unbindClickOutside() {
      this.clickOutside && (this.clickOutside.remove(), this.clickOutside = null);
    },
    setActiveAndBindEvents() {
      this.$main.addClass('popover--active'),
      this.bindClickOutside();
    },
    show() {
      this.$el.css({ display: 'block' }),
      setTimeout(::this.setActiveAndBindEvents, 1);
    },
  });

  Tumblr.Fox.Filters = FilterComponent;

  return Tumblr;
})
