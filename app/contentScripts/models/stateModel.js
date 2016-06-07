module.exports = (function (Tumblr, Backbone, _) {
  const { Model } = Backbone;
  const { assign, mapKeys } = _;

  const State = Model.extend({
    initialize(e) {
      assign(this, e);
    },
    set() {
      Backbone.Model.prototype.set.apply(this, arguments);
      Backbone.Model.prototype.set.call(this, 'state', this.getState());
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
