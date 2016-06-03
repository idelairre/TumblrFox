module.exports = (function(Tumblr, Backbone, _) {
  const { assign, mapKeys } = _;

  const State = Backbone.Model.extend({
    initialize(e) {
      assign(this, e);
    },
    getState() {
      for (const key in this.attributes) {
        if (this.attributes[key]) {
          return key;
        }
      }
    },
    setState(state) {
      const attributes = this.attributes;
      mapKeys(attributes, (value, key) => {
        attributes[key] = !1;
        if (key === state) {
          attributes[key] = !0;
        }
      });
      this.set(attributes);
      this.trigger('change:state');
    }
  });

  Tumblr.Fox.state = new State({
    dashboard: !1,
    user: !0,
    likes: !1
  });

  Tumblr.Fox.searchOptions = new State({
    tag: !0,
    text: !1
  });

  Tumblr.Fox.State = State;
})
