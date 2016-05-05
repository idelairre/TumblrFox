module.exports = (function filterIcon() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { getComponent, get, FilterPopoverContainer } = Tumblr.Fox;

  let FilterIcon = Backbone.View.extend({
    template: $('#filterIconTemplate').html(),
    className: 'tab iconic tab_filtered_posts',
    id: 'filter_button',
    events: {
      'click button': 'togglePopover'
    },
    render() {
      this.$el.html(this.template),
      $('.tab_bar').append(this.$el),
      this.popover = new FilterPopoverContainer();
    },
    togglePopover() {
      if (!Tumblr.Fox.options.rendered) {
        this.popover.render();
        Tumblr.Fox.options.rendered = true;
        return;
      }
      this.popover.show();
    }
  });

  let filterPopoverIcon = new FilterIcon();

  if (!Tumblr.Fox.options.test) {
    filterPopoverIcon.render();
  }

  Tumblr.Fox.FilterPopoverIcon = filterPopoverIcon;

  return Tumblr.Fox.FilterPopoverMenu;
})
