module.exports = (function (Tumblr, Backbone, _) {
  const { Model } = Backbone;
  const { assign, mapKeys } = _;

  const State = Model.extend({
    initialize(options) {
      assign(this, options);
    },
    set() {
      Model.prototype.set.apply(this, arguments);
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
      if (!Object.keys(this.attributes).includes(state)) {
        console.error(`Error: "${state}" is not a valid state. Valid states: "${Object.keys(this.attributes)}"`);
        return;
      } else if (this.getState() === state) {
        console.error(`Error: state model is already in state "${state}"`);
        return;
      }
      mapKeys(attributes, (value, key) => {
        attributes[key] = false;
        if (key === state) {
          attributes[key] = true;
        }
      });
      this.set(attributes);
    }
  });

  Tumblr.Fox.register('StateModel', State);
});
