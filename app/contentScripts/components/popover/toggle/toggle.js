module.exports = (function followerItem(Tumblr, Backbone, _) {
  const { $, View, Model } = Backbone;
  const { assign, template } = _;
  const { Utils } = Tumblr.Fox;

  const Toggle = View.extend({
    template: template(Utils.TemplateCache.get('toggleTemplate')),
    tagName: 'a',
    events: {
      'click': 'toggle'
    },
    initialize(e) {
      this.options = assign({}, e);
      this.state = new Model({
        toggled: false,
        disabled: false
      }),
      this.bindEvents();
    },
    render() {
      this.$el.html(this.template(this.options));
      this.$el.addClass(`toggle-${this.options.name}`);
      this.$el.prop('href', '#');
      this.$button = this.$el.find('.indicator');
      this.rendered = true; // NOTE: all tumblr subviews must alert that they have been rendered or the parent component won't call "afterRender()"
    },
    bindEvents() {
      this.listenTo(this.state, 'change:toggled', ::this.setState);
    },
    toggle(e) {
      this.state.set('toggled', !this.state.get('toggled'));
    },
    setState(toggled) {
      if (this.state.get('toggled')) {
        this.$button.text('-');
      } else if (!this.state.get('toggled')) {
        this.$button.text('+');
      } else if (this.state.get('disabled')) {
        this.state.set('toggled', false);
        this.undelegateEvents();
        this.stopListening();
      }
    }
  });

  Tumblr.Fox.register('ToggleComponent', Toggle);

});
