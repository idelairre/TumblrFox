module.exports = (function popover() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { template } = _;
  const { get, PopoverMixin } = Tumblr.Fox;
  const PopoverComponent = get('PopoverComponent');

  let Popover = PopoverComponent.extend({
    mixins: [PopoverMixin],
    template: template($('#popoverTemplate').html()),
    events: {
      'click li.popover_menu_item': 'toggleSelected'
    },
    initialize(e) {
      this.options = Object.assign({}, e),
      this.initialized = !1;
    },
    render() {
      this.$el = this.$el.html(this.template(this.options));
      this.$el.addClass(this.options.class);
    },
    toggleSelected(e) {
      const target = $(e.target);
      const tag = target.prop('tagName');
      let option;
      if (tag === 'LI') {
        option = target.find('a').data('js-menu-item-link');
      } else if (tag === 'A') {
        option = target.data('js-menu-item-link');
      }
      this.options.items.map(section => {
        if (!this.options.multipleSelection) {
          section.listItems.map(li => {
            if (li.name.toLowerCase() !== option) {
              li.checked = false;
            }
            if (li.name.toLowerCase() === option) {
              li.checked = true;
            }
          });
        }
      });
      this.setSelected(option);
    },
    setSelected(option) {
      this.$(`i.icon[data-check]`).hide();
      this.$(`i.icon[data-check="${option}"]`).show();
      return this.options.onSelect.apply(this, arguments);
    }
  })

  Tumblr.Fox.Popover = Popover;

  return Tumblr.Fox.Popover;
})
