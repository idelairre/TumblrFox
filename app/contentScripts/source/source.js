module.exports = (function (Tumblr, Backbone, _) {
  const { extend, isArray, isFunction, result } = _;

  const Source = function (options) {
    this.options = extend({}, result(this, 'options'), options);
    if (isArray(this.mixins)) {
      this.mixins.forEach(mixin => {
        mixin.applyTo(this.prototype);
      });
    }
    if (isFunction(this.initialize)) {
      this.initialize.apply(this, arguments);
    }
  };

  Source.extend = Backbone.Model.extend;

  Tumblr.Fox.register('SourceClass', Source);

});
