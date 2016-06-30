module.exports = (function info(Tumblr, Backbone, _) {
  const { $, View } = Backbone;
  const { TemplateCache } = Tumblr.Fox.Utils;

  const Info = View.extend({
    id: 'info',
    startWithParent: true,
    template: '<li class="sidebar_nav_item" id="tumblrFoxInfo"><a class="sidebar_link">TumblrFox</a></li>',
    events: {
      'click #tumblrFoxInfo': 'showDialog'
    },
    initialize(options) {
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
          content: `<div class="text">TumblrFox ${Tumblr.Fox.options.get('version')} installed. Release notes: <a href="https://github.com/idelairre/TumblrFox/releases/tag/v${Tumblr.Fox.options.get('version')}" target="_blank">link</a></div>`
        }
      });
    }
  });

  Tumblr.Fox.register('InfoComponent', Info);

});
