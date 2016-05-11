module.exports = (function popoverMixin() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { get } = Tumblr.Fox;
  const Popover = get('PopoverMixin');
  const Mixin = get('Mixin');
  const transition = get('animation').transition;
  const ClickHandler = get('ClickHandler');

  let PopoverMixin = new Mixin({
    afterRender() {
      this.initialized = !1,
      this.$main = this.$('.popover_menu'),
      setTimeout(::this.setActiveAndBindEvents, 1);
    },
    bindClickOutside() {
      const options = {
        preventInteraction: !0,
        ignoreSelectors: ['.popover_content_wrapper', '.tumblelog_popover']
      };
      this._popoverBase.autoTeardown && (this.clickOutside = new ClickHandler(this.el, options),
      this.clickOutside.on('click:outside', this.hide, this),
      this.clickOutside.on('click:inside', this.hideOnSelect, this));
    },
    hideOnSelect(e) {
      e.preventDefault();
      this.hide();
    },
    unbindClickOutside() {
      this.clickOutside && (this.clickOutside.remove(), this.clickOutside = null);
    },
    setActiveAndBindEvents() {
      this.$main.addClass('popover--active'),
      this.bindClickOutside(),
      this.initialized = !0;
    },
    show() {
      this.$el.css({ display: 'block' }),
      setTimeout(::this.setActiveAndBindEvents, 1);
    },
    hide() {
      this.unbindClickOutside(),
      this.$main.removeClass('popover--active'),
      transition(this.$el, () => {
        this.afterHide();
      });
    },
    afterHide() {
      this.teardown(),
      this.remove();
    }
  });

  Object.assign(PopoverMixin.properties, Popover.properties);

  Tumblr.Fox.PopoverMixin = PopoverMixin;

  return Tumblr.Fox.PopoverMixin;
});
