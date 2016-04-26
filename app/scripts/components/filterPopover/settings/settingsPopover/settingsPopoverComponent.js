module.exports = (function settingsPopover() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { get, require } = Tumblr.Fox;
  const transition = get('animation').transition;
  const popover = get('PopoverMixin');
  const PopoverComponent = get('PopoverComponent');
  const ClickHandler = get('ClickHandler');

  let SettingsPopoverComponent = PopoverComponent.extend({
    className: 'popover--settings-popover',
    mixins: [popover],
    template: $('#settingsPopoverTemplate').html(),
    initialize(e) {
      return this.options = Object.assign({}, e),
      PopoverComponent.prototype.initialize.apply(this, e);
    },
    render() {
      return this.$el.html(this.template),
      this.$pinned.addClass('active'),
      this.$settingsPopoverMenu = this.$('.popover_menu'),
      console.log('[RENDERED COMPONENT]', this, this.$settingsPopoverMenu),
      this;
    },
    show() {
      this.$pinned.addClass('active'),
      this.$el.css({ display: 'block' }),
      setTimeout(() => {
        this.$settingsPopoverMenu.addClass('popover--active');
      }, 1);
    },
    hide() {
      console.log('[HIDE] called', this.$el);
      this.$pinned.removeClass('active'),
      transition(this.$el, () => {
        this.$el.css({ display: 'none' });
      });
    }
  })

  Tumblr.Fox.SettingsPopoverComponent = SettingsPopoverComponent;

  return Tumblr.Fox;
})
