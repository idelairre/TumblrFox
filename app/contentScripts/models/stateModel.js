import { Model } from 'backbone';

const State = Model.extend({
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
    if (!Object.keys(this.attributes).includes(state)) {
      console.error(`Error: "${state}" is not a valid state. Valid states: "${Object.keys(this.attributes)}"`);
      return;
    } else if (this.getState() === state) {
      console.error(`Error: state model is already in state "${state}"`);
      return;
    }
    
    for (const key in this.attributes) {
      if (key === state) {
        this.attributes[key] = true;
      } else {
        this.attributes[key] = false;
      }
    };
    this.set(this.attributes);
  }
});

module.exports = State;
