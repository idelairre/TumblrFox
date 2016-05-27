module.exports = (function followerItem(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { assign, template } = _;

  const Toggle = Backbone.View.extend({
    template: template($('#toggleTemplate').html()),
    tagName: 'a',
    events: {
      'click': 'toggle'
    },
    initialize(e) {
      this.options = assign({}, e);
      this.state = new Backbone.Model({
        toggled: false
      }),
      this.bindEvents();
    },
    render() {
      this.$el.html(this.template(this.options));
      this.$el.addClass(`toggle-${this.options.name}`);
      this.$el.prop('href', '#');
      this.$button = this.$el.find('.indicator');
      this.rendered = !0; // NOTE: all tumblr subviews must alert that they have been rendered or the parent component won't call "afterRender()"
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
      } else {
        this.$button.text('+');
      }
    }
  });

  Tumblr.Fox.Toggle = Toggle;
})
