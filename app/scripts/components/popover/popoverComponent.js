module.exports = (function popover(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { template } = _;
  const { get, PopoverMixin } = Tumblr.Fox;
  const PopoverComponent = get('PopoverComponent');

  /**
   * Constructor - passed in through controller component
   * @constructor
   * @param {HTML Element} pinnedTarget Element to pin popover to
   * @param {String} pinnedSide Direction popover will appear from
   * @param {String} class Optional css class of the popover.
   * @param {String} selection Optional selection indicator. Recognized parameters"
   *     "checkmark" {String} Displays checkmark
   *     "none" {String} Displays nothing
   * @param {String} multipleSelection The OAuth consumer secret.
   * @param {Array} items Html list items and headers to display. Recognized parameters:
   *     "header" {String} Optional name of the current application
   *     "listItems" {Array} Li tags and their properties. Recognized parameters:
            "icon" {String} Optional css class of the icon to prepend to list item
            "name" {String} Optional text body of the list item
            "checked" {Boolean} Optional default checked state
   * @param {Function} onSelect Optional function to perform on list item selection.
   */

   /**
   * Component API:
   * In your controller component set the following in defaults or wherever:
   *   ...
   *   popoverOptions: [{
   *     header: 'Whatever',
   *     listItems: [
   *       { icon: 'none', name: 'Search likes', checked: false },
   *       { icon: 'none', name: 'Search by user', checked: true },
   *       { icon: 'none', name: 'Search dashboard', checked: false }
   *     ]
   *   }]
   *
   * Then in the body of the Backbone.View class set a method like the following:
   *   ...
   *   togglePopover() {
   *     this.popover || (this.popover = new Popover({
   *       pinnedTarget: this.$el,
   *       pinnedSide: 'bottom',
   *       class: 'popover--settings-popover',
   *       selection: 'checkmark',
   *       multipleSelection: false,
   *       items: this.options.popoverOptions,
   *       onSelect: this.onSelect
   *     }),
   *     this.popover.render(),
   *     this.listenTo(this.popover, 'close', this.onPopoverClose));
   *   },
   */

  const Popover = PopoverComponent.extend({
    mixins: [PopoverMixin],
    template: template($('#popoverTemplate').html()),
    events: {
      'click li.popover_menu_item': 'toggleSelected'
    },
    initialize(e) {
      this.options = Object.assign({}, e);
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
            if (li.name.toLowerCase() === option) {
              li.checked = true;
            } else {
              li.checked = false;
            }
            return li;
          });
        }
        return section;
      });
      this.setSelected(option);
    },
    setSelected(option) {
      this.$(`i.icon[data-check]`).hide();
      this.$(`i.icon[data-check="${option}"]`).show();
      return this.options.onSelect.apply(this, arguments);
    }
  });

  Tumblr.Fox.Popover = Popover;

  return Tumblr.Fox.Popover;
});
