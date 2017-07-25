import { defaults, pick, template, omit } from 'lodash';
import ComponentFetcher from '../../../utils/componentFetcherUtil';
import filterMenuTemplate from './filterMenuTemplate.html';

const { BlogSearchPopover, KeyCommandsMixin, TumblrView } = ComponentFetcher.getAll('BlogSearchPopover', 'KeyCommandsMixin', 'TumblrView');

const FilterMenuComponent = TumblrView.extend({
  className: 'popover--filter-select-dropdown',
  template: template(filterMenuTemplate, { imports: { _: window._ } }),
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
    'click [data-js-menu-item]': 'selectLi'
  },
  initialize(options) {
    Object.assign(this, pick(options, ['state', 'model']));
    this.options = defaults(omit(options, ['state', 'model']), this.defaults);
    // this.bindEvents();
  },
  render() {
    this.$el.html(this.template);
    // this.resetChecks();
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
    if (!this.options.keycommands) { // TODO: look at this
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
    // BlogSearchPopover.prototype.selectLi.apply(this, arguments);
    e.preventDefault();

    if (this.disabled) {
      return;
    }

    const $selected = this.$(e.currentTarget);
    const type = $selected.find('[data-js-menu-item-link]').data('js-menu-item-link');
    this.resetChecks();
    $selected.find(`i[data-check="${type}"]`).show();
    this.model.set('post_type', type.toUpperCase());
  },
  scrollToActive() {
    BlogSearchPopover.prototype.scrollToActive.apply(this, arguments);
  },
  resetChecks() {
    this.$('i[data-check]').hide();
  }
});

module.exports = FilterMenuComponent;
