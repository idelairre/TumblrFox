module.exports = (function info(Tumblr, Backbone, $, _) {
  const { assign, template, pick } = _;
  const { View } = Backbone;
  const { TemplateCache } = Tumblr.Fox.Utils;

  const Info = View.extend({
    name: 'info',
    startWithParent: true,
    className: 'sidebar_nav_item',
    tagName: 'li',
    template: '<a class="sidebar_link" id="tumblrFoxInfo">TumblrFox</a>',
    events: {
      'click #tumblrFoxInfo': 'showDialog'
    },
    initialize(options) {
      assign(this, pick(options, ['options']));
      this.render();
    },
    render() {
      const sidebarFooterNav = $('#sidebar_footer_nav').find('ul li:last-child');
      if (sidebarFooterNav.length > 0) {
        this.$el.html(this.template);
        sidebarFooterNav.before(this.$el);
      }
    },
    showDialog() {
      Tumblr.Dialog.alert({
        templates: {
          content: template(TemplateCache.get('infoTemplate'))
        }
      });
    }
  });

  Tumblr.Fox.register('InfoComponent', Info);

});
