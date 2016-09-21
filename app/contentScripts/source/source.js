import { result } from 'lodash';

const Source = function (options) {
  this.options = Object.assign({}, result(this, 'options'), options);
  if (Array.isArray(this.mixins)) {
    this.mixins.forEach(mixin => {
      mixin.applyTo(this);
    });
  }
  if (typeof this.initialize === 'function') {
    this.initialize.apply(this, arguments);
  }
};

Source.extend = Backbone.Model.extend;

module.exports = Source;
