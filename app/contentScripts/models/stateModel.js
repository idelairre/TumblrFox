module.exports = (function (Tumblr, Backbone, _) {
  const { assign, mapKeys } = _;

  const State = Backbone.Model.extend({
    initialize(e) {
      assign(this, e);
    },
    set() {
      Backbone.Model.prototype.set.apply(this, arguments);
      this.trigger('change:state', this.getState());
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
        attributes[key] = false;
        if (key === state) {
          attributes[key] = true;
        }
      });
      this.set(attributes);
    }
  });

  Tumblr.Fox.state = new State({
    dashboard: false,
    user: true,
    likes: false
  });

  Tumblr.Fox.searchOptions = new State({
    tag: true,
    text: false
  });

  Tumblr.Fox.State = State;
});
