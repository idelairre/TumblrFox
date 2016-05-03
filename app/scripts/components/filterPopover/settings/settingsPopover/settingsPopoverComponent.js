module.exports = (function settingsPopover() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { get } = Tumblr.Fox;
  const transition = get('animation').transition;
  const popover = get('PopoverMixin');
  const PopoverComponent = get('PopoverComponent');
  const ClickHandler = get('ClickHandler');

  let SettingsPopoverComponent = PopoverComponent.extend({
    className: 'popover--settings-popover',
    mixins: [popover],
    template: $('#settingsPopoverTemplate').html(),
    initialize(e) {
      return this.options = Object.assign({}, e);
    },
    render() {
      return this.$el.html(this.template),
      this.initialized = !1,
      this.$main = this.$('.popover_menu'),
      this.$dashboard = this.$('.dashboard'),
      this.$user = this.$('.user'),
      this.$likes = this.$('.likes'),
      this.setSelected(Tumblr.Fox.Posts.get('tagSearch')),
      setTimeout(::this.setActiveAndBindEvents, 1),
      this;
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
    unbindClickOutside() {
      this.clickOutside && (this.clickOutside.remove(), this.clickOutside = null)
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
    setSelected(setting) {
      if (this.initialized) {
        Tumblr.Fox.Posts.set('tagSearch', setting);
        Tumblr.Events.trigger('fox:setSearchState', setting);
      }
      this.$('i').each(function () {
        $(this).hide();
      });
      this.$(`i.${setting}`).show();
    },
    hide() {
      this.unbindClickOutside(),
      this.$main.removeClass('popover--active'),
      transition(this.$el, ::this.afterHide);
    },
    hideOnSelect(e) {
      e.preventDefault();
      const target = $(e.target);
      const tag = target.prop('tagName');
      if (tag === 'LI') {
        let setting = target.find('a').data('js-menu-item-link');
        this.setSelected(setting);
      } else if (tag === 'A') {
        let setting = target.data('js-menu-item-link');
        this.setSelected(setting);
      }
      this.hide();
    },
    afterHide() {
      this.teardown(),
      this.remove();
    }
  })

  Tumblr.Fox.SettingsPopoverComponent = SettingsPopoverComponent;

  return Tumblr;
})
