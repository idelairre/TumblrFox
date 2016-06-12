module.exports = (function popoverMixin(Tumblr, Backbone, _) {
  const { assign } = _;
  const { get, put } = Tumblr.Fox;
  const Popover = get('PopoverMixin');
  const Mixin = get('Mixin');
  const transition = get('animation').transition;
  const ClickHandler = get('ClickHandler');

  const PopoverMixin = new Mixin({
    afterRender() {
      this.initialized = false;
      this.$main = this.$('.popover_menu');
      setTimeout(::this.setActiveAndBindEvents, 1);
    },
    bindClickOutside() {
      const options = {
        preventInteraction: true,
        ignoreSelectors: ['.popover_content_wrapper', '.tumblelog_popover']
      };
      if (this._popoverBase.autoTeardown) {
        this.clickOutside = new ClickHandler(this.el, options);
        this.clickOutside.on('click:outside', this.hide, this);
        this.clickOutside.on('click:inside', this.hideOnSelect, this); // make this optional
      }
    },
    hideOnSelect(e) {
      e.preventDefault();
      this.hide();
    },
    unbindClickOutside() {
      if (this.clickOutside) {
        this.clickOutside.remove();
        this.clickOutside = null;
      }
    },
    setActiveAndBindEvents() {
      this.$main.addClass('popover--active');
      this.bindClickOutside();
      this.initialized = true;
    },
    show() {
      this.$el.css({
        display: 'block'
      });
      setTimeout(::this.setActiveAndBindEvents, 1);
    },
    hide() {
      this.unbindClickOutside();
      this.$main.removeClass('popover--active');
      transition(this.$el, () => {
        this.afterHide();
      });
    },
    afterHide() {
      this.teardown();
      this.remove();
    }
  });

  assign(PopoverMixin.properties, Popover.properties);

  Tumblr.Fox.register('ExtendedPopoverMixin', PopoverMixin);
});
