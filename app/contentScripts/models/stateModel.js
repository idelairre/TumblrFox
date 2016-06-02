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
      mapKeys(this.attributes, (value, key) => {
        this.attributes[key] = !1;
        if (key === state) {
          this.attributes[key] = !0;
        }
      });
      this.set(this.attributes);
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
