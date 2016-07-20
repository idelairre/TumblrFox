import { extend, isArray, isFunction, result } from 'lodash';

const Source = function (options) {
  this.options = extend({}, result(this, 'options'), options);
  if (isArray(this.mixins)) {
    this.mixins.forEach(mixin => {
      mixin.applyTo(this);
    });
  }
  if (isFunction(this.initialize)) {
    this.initialize.apply(this, arguments);
  }
};

Source.extend = Backbone.Model.extend;

module.exports = Source;
