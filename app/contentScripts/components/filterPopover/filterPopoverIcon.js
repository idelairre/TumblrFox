module.exports = (function filterIcon(Tumblr, Backbone, _, FilterPopoverComponent, FilterPopoverContainer) {
  const { View, $ } = Backbone;
  const { assign, pick } = _;
  const { get } = Tumblr.Fox;
  const { ComponentFetcher } = Tumblr.Fox.Utils;

  const filterIconTemplate = `
    <script id="filterIconTemplate" type="text/template">
      <button tabindex="8" class="tab_anchor" style="margin-top: 0px" aria-haspopup="true" title="Filtered Posts">
        <i class="tumblr-fox-icon-container" style="font-size: 20px">
          <img class="tumblr-fox-icon" height="20px" width="20px" src="data:image/png;base64,${Tumblr.Fox.constants.icon}" />
        </i>
      </button>
      <span class="tab_notice tab-notice--outlined">
        <span class="tab_notice_value"></span>
      </span>
    </script>`;

  const FilterIcon = View.extend({
    startWithParent: true,
    template: $(filterIconTemplate).html(),
    className: 'tab iconic tab_filtered_posts',
    id: 'filter',
    events: {
      'click button': 'togglePopover'
    },
    initialize(options) {
      assign(this, pick(options, ['options', 'state']));
      this.options.set('initialized', true);
      this.render();
    },
    render() {
      this.$el.html(this.template);
      $('.tab_bar').append(this.$el);
      this.popover = new FilterPopoverContainer({
        viewOptions: {
          state: this.state,
          options: this.options
        }
      });
      this.$tabNotice = this.$el.find('.tab_notice');
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Fox, 'initialize:firstRun', () => {
        this.$tabNotice.prop('class', 'tab_notice tab-notice--outlined new_post_notice_container  tab-notice--active');
        this.$tabNotice.find('.tab_notice_value').text(this.options.get('version'));
        setTimeout(() => {
          this.$tabNotice.fadeOut(200).promise().then(() => {
            Tumblr.Fox.updateConstants({
              firstRun: false
            });
          });
        }, 1500);
      });
    },
    togglePopover() {
      if (!this.options.get('rendered')) {
        this.popover.render();
        this.options.set('rendered', true);
        return;
      }
      this.popover.show();
    }
  });

  Tumblr.Fox.register('FilterPopoverIconComponent', FilterIcon);

})
