module.exports = (function followerList(Tumblr, Backbone, _, FollowerModel, FollowerItemComponent, FollowerSearchComponent, StateModel) {
  const { $, View } = Backbone;
  const { assign, debounce, each } = _;

  // NOTE: for the sort by update time it might be best to fetch the next page rather than load all cached followers

  /**
  * states:
  *     default => do nothing => onScroll => populateFollowers from ajax response
  *     alphabetically => clear elements => onScroll => populate followers from model
  *     updated => clear elements => onScroll => populate followers from model
  */

  const FollowerList = View.extend({
    defaults: {
      offset: 25,
      limit: 25,
      state: {
        orderFollowed: true,
        alphabetically: false,
        recentlyUpdated: false
      }
    },
    initialize(options) {
      this.options = assign({}, options, this.defaults);
      this.state = new StateModel(this.defaults.state);
      this.attachNode = this.$el.find('.left_column');
      this.model = new FollowerModel();
      this.$el.find('.left_column').addClass('ui_notes');
      this.$followers = this.$('.follower');
      this.$followers = this.$followers.slice(1, this.$followers.length);
      this.$followerSearch = new FollowerSearchComponent({
        state: this.state,
        model: this.model,
        el: $('#invite_someone')
      });
      this.$pagination = this.$('#pagination'); // insert followers before pagination element
      this.$pagination.remove();
      this.loader = new Tumblr.Prima.KnightRiderLoader({
        variation: 'leviathan',
        className: 'Knight-Rider-loader centered'
       });
      this.loader.render();
      this.$el.find('.left_column').prepend('<div class="load_cont"></div>');
      this.$('.load_cont').append(this.loader.$el);
      this.bindEvents();
    },
    events: {
      'click input.text_field': 'togglePopover'
    },
    bindEvents() {
      this.listenTo(Tumblr.Fox.Events, 'fox:following:refresh', ::this.refresh);
      this.listenTo(Tumblr.Fox.Events, 'fox:following:state', ::this.state.setState);
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', debounce(this.onScroll, 100));
      this.listenTo(this.model.items, 'reset', ::this.populate);
      this.listenTo(this.state, 'change:state', ::this.fetch);
    },
    togglePopover(e) {
      e.preventDefault();
      // TODO: implement following search
    },
    refresh() {
      this.model.options.offset = 0;
      this.fetch();
    },
    fetch() {
      this.options.offset = 0;
      const query = this.state.getState();
      if (query === 'orderFollowed') {
        this.clearElements().then(() => {
          this.model.fetch(query).then(::this.renderFollowerViews);
        });
      } else {
        this.clearElements().then(() => {
          this.model.fetch(query);
        });
      }
    },
    clearElements() {
      return this.$followers.fadeOut(300).promise();
    },
    onScroll(e) {
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        if (this.loader.get('loading')) {
          return;
        }
        if (this.state.get('orderFollowed')) {
          this.loader.set('loading', true);
          this.model.fetch(this.state.getState()).then(followers => {
            this.renderFollowerViews(followers);
            this.loader.set('loading', false);
          });
        } else {
          const followers = this.model.items.slice(this.options.offset, this.options.offset += this.options.limit);
          this.loader.set('loading', true);
          followers.map(follower => {
            setTimeout(() => {
              this.loader.set('loading', false);
              this.renderFollower(follower);
            }, 100);
          });
        }
      }
    },
    populate(e) {
      const followers = e.models.slice(0, this.options.limit);
      this.clearElements().then(() => {
        followers.map(follower => {
          return this.renderFollower(follower);
        });
        this.$followers = this.$('.follower');
        this.$followers = this.$followers.slice(1, this.$followers.length);
        this.options.offset += followers.length;
      });
    },
    renderFollower(model) {
      const follower = new FollowerItemComponent({ model });
      follower.render();
      this.attachNode.append(follower.$el);
      return follower.$el[0];
    },
    renderFollowerViews(response) {
      each(response, view => {
        this.attachNode.append(view); // use the tumblr follower init code to append snowmen
        this.renderSnowman(this.$(view));
      });
      this.$followers = this.$('.follower');
      this.$followers = this.$followers.slice(1, this.$followers.length);
    },
    renderSnowman(view) {
      const tumblelogData = view.find('[data-tumblelog-popover]').data('tumblelog-popover');
      if (!tumblelogData) {
        return;
      }
      const tumblelogModel = new Tumblr.Prima.Models.Tumblelog(tumblelogData);
      const dropdown = view.find('.user_dropdown_lockup');
      const snowman = {
        el: dropdown,
        model: tumblelogModel,
        infoPopover: {
          el: view,
          auto_show: false,
          trigger: view,
          glassless: true,
          standalone: true,
          show_flag_button: false,
          targetPost: view
        }
      };
      new Tumblr.Prima.Snowman(snowman);
      new FollowerItemComponent({
        model: tumblelogModel,
        el: view
      });
    }
  });

  Tumblr.Fox.register('FollowerListComponent', FollowerList);

});
