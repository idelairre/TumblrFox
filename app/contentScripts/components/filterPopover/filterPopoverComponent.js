module.exports = (function filterPopoverComponent(Tumblr, Backbone, _, FilterMenuComponent, SearchComponent, SearchModel) {
  const { $ } = Backbone;
  const { assign, omit, pick } = _;
  const { get, Utils } = Tumblr.Fox;
  const { ComponentFetcher } = Utils;
  const { transition } = get('animation');
  const { ConversationsCollection, ClickHandler, PopoverMixin, TumblrView } = ComponentFetcher.getAll('ConversationsCollection', 'ClickHandler', 'PopoverMixin', 'TumblrView');
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;

  const filterPopoverTemplate = `
    <script id="filterPopoverTemplate" type="text/template">
      <div id="filterPopoverMenu" class="popover popover_menu popover_gradient" style="display: block; width: 240px; margin-top: -4px;">
        <div class="popover_inner">
          <ul class="popover_inner_list">
            <div class="filter-menu" data-subview="filterMenu"></div>
            <div data-subview="searchFilter"></div>
          </ul>
        </div>
      </div>
    </script>`;

  const FilterPopoverComponent = TumblrView.extend({
    className: 'popover--filter-popover',
    defaults: {
      preventInteraction: true
    },
    mixins: [PopoverMixin],
    template: $(filterPopoverTemplate).html(),
    subviews: {
      filterMenu: {
        constructor: get('FilterMenuComponent'),
        options: opts => {
          return {
            model: opts.model,
            state: opts.state,
            keycommands: true
          }
        }
      },
      searchFilter: {
        constructor: get('SearchComponent'),
        options: opts => {
          return {
            conversations: opts.conversations,
            model: opts.model,
            state: opts.state
          };
        }
      }
    },
    initialize(options) {
      assign(this, pick(options, ['state', 'options']));
      this.options = assign({}, this.defaults, omit(options, ['state', 'options']));
      this.conversations = new ConversationsCollection();
      this.model = new SearchModel({
        blogname: Tumblr.Prima.currentUser().id,
        state: this.state
      });
    },
    render() {
      this.$el.html(this.template);
      this.$pinned.addClass('active');
      this.$filterPopoverMenu = this.$('.popover_menu');
      this.$searchBar = this.$('.filter-search');
      setTimeout(() => {
        this.$filterPopoverMenu.addClass('popover--active');
        this.bindClickOutside();
      }, 0);
    },
    bindClickOutside() {
      const options = {
        preventInteraction: true,
        ignoreSelectors: ['.popover', '.popover_inner', '.popover_content_wrapper', '.popover_inner_list', '.popover_menu_list', '.tumblelog_popover', '.ui_peepr_glass', '.drawer']
      };
      this.clickOutside = new ClickHandler(this.el, options);
      this.clickOutside.on('click:outside', this.hide, this);
      this.listenTo(Tumblr.Events, 'DOMEventor:keyup:escape', this.hide);
    },
    beforeTeardown() {
      this.remove();
      this.$pinned.removeClass('active');
    },
    unbindClickOutside() {
      this.clickOutside.remove();
      this.clickOutside = null;
      this.stopListening(Tumblr.Events, 'DOMEventor:keyup:escape');
    },
    hide() {
      Tumblr.Events.trigger('popover:close', this);
      this.unbindClickOutside();
      // this.searchFilter.unbindEvents(); NOTE: this needs to be looked at
      this.$pinned.removeClass('active');
      this.$filterPopoverMenu.removeClass('popover--active');
      transition(this.$el, ::this.afterHide);
    },
    afterHide() {
      this.$el.css({
        display: 'none'
      });
    },
    show() {
      Tumblr.Events.trigger('popover:open', this);
      this.bindClickOutside();
      this.searchFilter.bindEvents();
      this.$pinned.addClass('active');
      this.$el.css({ display: 'block' });
      setTimeout(() => {
        this.$filterPopoverMenu.addClass('popover--active');
      }, 1);
    }
  });

  Tumblr.Fox.register('FilterPopoverComponent', FilterPopoverComponent);

});
