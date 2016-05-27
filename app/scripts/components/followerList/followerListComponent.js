module.exports = (function followerList(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { assign, debounce, each } = _;
  const { FollowerModel, FollowerItem, FollowerSearch } = Tumblr.Fox;

  // NOTE: for the sort by update time it might be best to fetch the next page rather than load all cached followers

  // states:
  //    default => do nothing => onScroll => populateFollowers from ajax response
  //    alphabetically => clear elements => onScroll => populate followers from model
  //    updated => clear elements => onScroll => populate followers from model

  const FollowerList = Backbone.View.extend({
    defaults: {
      offset: 25,
      limit: 25,
      state: {
        followed: !0,
        alphabetically: !1,
        updated: !1
      },
      query: 'followed'
    },
    initialize(e) {
      this.options = assign({}, e, this.defaults);
      this.state = this.defaults.state;
      this.attachNode = this.$el.find('.left_column');
      this.model = new FollowerModel();
      this.$el.find('.left_column').addClass('ui_notes');
      this.$followers = this.$('.follower');
      this.$followers = this.$followers.slice(1, this.$followers.length);
      this.$followerSearch = new FollowerSearch({
        el: $('#invite_someone')
      });
      this.$pagination = this.$('#pagination'); // insert followers before pagination element
      this.$pagination.remove();
      this.$loader = new Tumblr.Prima.KnightRiderLoader({ variation: 'leviathan', className: 'Knight-Rider-loader centered' });
      this.$loader.render();
      this.$el.find('.left_column').prepend('<div class="load_cont"></div>');
      this.$('.load_cont').append(this.$loader.$el);
      this.bindEvents();
    },
    events: {
      'click input.text_field': 'togglePopover'
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:fetchFollowers', ::this.fetch);
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', debounce(this.onScroll, 100));
      this.listenTo(this.model.items, 'reset', this.populate);
      this.listenTo(this.model, 'all', console.log.bind(console, '[FOLLOWER MODEL]'));
    },
    togglePopover(e) {
      e.preventDefault();
      // TODO: make this component actually useful
      console.log('[AUTOCOMPLETE POPOVER]', e);
    },
    fetch(option) {
      option = option.split(' ');
      option = option[option.length - 1];
      for (const key in this.state) {
        if (option !== key) {
          this.state[key] = false;
        }
        this.state[option] = true;
      }
      this.options.query = option;
      this.options.offset = 0;
      if (option === 'followed') {
        this.clearElements().then(() => {
          this.model.fetch(option).then(::this.renderFollowerViews);
        });
      } else {
        this.clearElements().then(() => {
          this.model.fetch(option);
        });
      }
    },
    clearElements() {
      const deferred = $.Deferred();
      this.$followers.fadeOut(300, () => {
        deferred.resolve();
      });
      return deferred.promise();
    },
    onScroll() {
      if (this.state.followed) {
        this.$loader.set('loading', true);
        this.model.fetch(this.options.query).then(followers => {
          this.renderFollowerViews(followers);
          this.$loader.set('loading', false);
        });
      } else {
        const followers = this.model.items.slice(this.options.offset, this.options.offset += this.options.limit);
        this.$loader.set('loading', true);
        followers.map(follower => {
          // this.$loader.set('loading', false);
          this.renderFollower(follower);
        });
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
      const follower = new FollowerItem({ model });
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
      new FollowerItem({
        model: tumblelogModel,
        el: view
      });
    }
  });

  if (window.location.href === 'https://www.tumblr.com/following') {
    Tumblr.Fox.FollowerList = new FollowerList({
      el: $('#following')
    });
  }
});
