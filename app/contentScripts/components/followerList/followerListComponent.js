module.exports = (function followerList(Tumblr, Backbone, _, FollowingModel, FollowerItemComponent, FollowerSearchComponent, TumblrView) {
  const { $, View } = Backbone;
  const { assign, debounce, each, invoke, pick, template } = _;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { TemplateCache, ComponentFetcher } = Tumblr.Fox.Utils;

  // NOTE: for the sort by update time it might be best to fetch the next page rather than load all cached followers

  /**
  * states:
  *     default => do nothing => onScroll => populateFollowers from ajax response
  *     alphabetically => clear elements => onScroll => populate followers from model
  *     updated => clear elements => onScroll => populate followers from model
  */

  const FollowerList = TumblrView.extend({
    defaults: {
      formkey: Tumblr.Fox.constants.formKey,
      offset: 25,
      limit: 25,
      state: {
        orderFollowed: true,
        alphabetically: false,
        recentlyUpdated: false
      }
    },
    id: 'invite_someone',
    className: 'follower invite_someone clearfix',
    template: template(TemplateCache.get('followerListTemplate')),
    subviews: {
      followerSearch: {
        constructor: FollowerSearchComponent,
        options: opts => {
          return {
            state: opts.state,
            model: opts.model
          }
        }
      }
    },
    initialize(options) {
      const State = ComponentFetcher.get('StateModel');
      this.options = assign({}, pick(options, Object.keys(this.defaults)));
      this.state = new State(this.defaults.state);
      this.model = new FollowingModel({
        offset: this.defaults.offset,
        limit: this.defaults.limit,
        state: this.state
      });
      this.loader = new Tumblr.Prima.KnightRiderLoader({
        variation: 'leviathan',
        className: 'Knight-Rider-loader centered'
      });
      this.followingViews = [];
      this.render();
    },
    render() {
      this.$el.html(this.template(this.model));
      $('#invite_someone').replaceWith(this.$el);
      this.loader.render();
      this.attachNode = $('.left_column');
      this.attachNode.addClass('ui_notes');
      $('#pagination').remove();
      this.$form = this.$('form');
      this.$form.css('display', 'inline-block');
      this.$el.css('background', '#f8f8f8 11px 5px no-repeat');
      this.$el.css('padding', '5px 10px 5px 0');
      this.$input = this.$el.find('input.text_field');
      this.initializeFollowings();
      this.bindEvents();
    },
    afterRenderSubviews() {
      this.attachNode.prepend('<div class="load_cont"></div>');
      this.attachNode.find('.load_cont').append(this.loader.$el);
    },
    events: {
      'click button.chrome': 'follow',
    },
    bindEvents() {
      this.listenTo(Tumblr.Fox.Events, 'fox:following:refresh', ::this.refresh);
      this.listenTo(Tumblr.Fox.Events, 'fox:following:state', ::this.state.setState);
      this.listenTo(Tumblr.Events, 'DOMEventor:flatscroll', debounce(this.onScroll, 150));
      this.listenTo(this.model, 'change:loading', ::this.setLoading);
      this.listenTo(this.model.items, 'reset', ::this.populate);
      this.listenTo(this.model.items, 'add', this.createFollower);
      this.listenTo(this.state, 'change:state', ::this.refresh);
    },
    initializeFollowings() {
      this.$followings = $('.follower');
      this.$followings = this.$followings.slice(1, this.$followings.length);
      this.$followings.each((i, followingEl) => {
        const following = new FollowerItemComponent({
          el: followingEl,
          model: this.createFollowingFromEl(followingEl)
        });
        this.followingViews.push(following);
      });
    },
    createFollowingFromEl(followingEl) {
      const json = $(following).find('[data-tumblelog-popover]').data('tumblelog-popover');
      return new Tumblelog(json);
    },
    setLoading(model, value) {
      this.loader.set('loading', value);
    },
    follow(e) {
      e.preventDefault();
      e.stopPropagation();
      const tumblelog = this.$input.val();
      Tumblr.follow({
        tumblelog,
        source: 'FOLLOW_SOURCE_FOLLOWING_PAGE'
      }, {
        success() {
          Tumblr.Fox.Events.trigger('fox:following:refresh');
        }
      });
    },
    refresh() {
      this.model.set('offset', 0);
      this.clearElements().then(::this.model.fetch);
    },
    clearElements() {
      const deferred = $.Deferred();
      this.$followings.fadeOut(300).promise().then(() => {
        invoke(this.followingViews, 'remove');
        deferred.resolve();
      });
      return deferred.promise();
    },
    onScroll(e) {
      if ((e.documentHeight - e.windowScrollY) < e.windowHeight * 3) {
        if (this.loader.get('loading')) {
          return;
        }
        this.model.fetch();
      }
    },
    populate(collection) {
      const followers = collection.models.slice(0, this.model.get('limit'));
      this.clearElements().then(() => {
        followers.map(::this.createFollower);
        this.model.set('offset', this.model.get('limit'));
        this.$followings = $('.follower');
        this.$followings = this.$followings.slice(1, this.$followings.length);
      });
    },
    createFollower(model) {
      const following = new FollowerItemComponent({ model });
      following.render();
      this.attachNode.append(following.$el);
      this.$followings.push(following.$el[0]);
      this.followingViews.push(following);
    }
  });

  Tumblr.Fox.register('FollowerListComponent', FollowerList);

});
