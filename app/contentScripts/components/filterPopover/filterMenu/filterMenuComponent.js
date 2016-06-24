module.exports = (function filterMenuComponent(Tumblr, Backbone, _) {
  const { assign, defaults, pick, template, omit } = _;
  const { View, Model } = Backbone;
  const { TemplateCache, ComponentFetcher } = Tumblr.Fox.Utils;
  const { TumblrView, BlogSearchPopover, KeyCommandsMixin } = ComponentFetcher.getAll('TumblrView', 'BlogSearchPopover', 'KeyCommandsMixin');

  const FilterMenuComponent = TumblrView.extend({
    className: 'popover--filter-select-dropdown',
    template: template(TemplateCache.get('filterMenuTemplate')),
    mixins: [KeyCommandsMixin],
    defaults: {
      keyboardFocusClass: 'keyboard_focus',
      keycommands: false
    },
    keycommands: {
      'keydown:down': 'targetNextLi',
      'keydown:tab': 'targetNextLi',
      'keydown:up': 'targetPrevLi',
      'keydown:shift+tab': 'targetPrevLi',
      'keyup:enter': 'selectLi'
    },
    events: {
      'click [data-js-menu-item]': 'toggleSelection'
    },
    initialize(options) {
      assign(this, pick(options, ['state', 'model']));
      this.options = defaults(omit(options, 'state', 'model'), this.defaults);
      this.bindEvents();
    },
    render() {
      this.$el.html(this.template);
      this.resetChecks();
      if (this.state.get('disabled')) {
        this.$('.popover_menu_item').addClass('disabled');
        return;
      }
      this.$('i[data-check="any"]').show();
    },
    afterRender() {
      if (this.options.keycommands) {
        setTimeout(::this.focusKeys, 0);
      }
    },
    bindEvents() {
      if (!this.options.keycommands) {
        // this.disableKeys();
        // Tumblr.Events.trigger('keycommands:suspend', true);
      }
    },
    targetNextLi() {
      BlogSearchPopover.prototype.targetNextLi.apply(this, arguments);
    },
    targetPrevLi() {
      BlogSearchPopover.prototype.targetPrevLi.apply(this, arguments);
    },
    selectLi(e) {
      e.preventDefault();
      const type = this.$active.find('[data-js-menu-item-link]').data('js-menu-item-link');
      this.resetChecks();
      this.$(`i[data-check="${type}"]`).show();
      this.model.set('post_type', type.toUpperCase());
    },
    scrollToActive() {
      BlogSearchPopover.prototype.scrollToActive.apply(this, arguments);
    },
    resetChecks() {
      this.$('i[data-check]').hide();
    },
    toggleSelection(e) {
      e.preventDefault();
      if (this.disabled) {
        return;
      }
      const type = this.$(e.target).data('js-menu-item-link');
      this.resetChecks();
      this.$(`i[data-check="${type}"]`).show();
      this.selectFilter(type.toUpperCase());
    },
    selectFilter(type) {
      this.model.set('post_type', type);
    }
  });

  Tumblr.Fox.register('FilterMenuComponent', FilterMenuComponent);
});
