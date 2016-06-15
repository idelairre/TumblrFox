module.exports = (function controllerModel(Tumblr, Backbone, _) {
  const { Model } = Backbone;
  const { assign, isFunction, isObject, noop } = _;

  const Controller = Model.extend({
    _setup(options) {
      options = options || {};
      this.models = assign({}, this.models, options.models);
      this._initializeModels(options, this.models);
    },
    constructor(options) {
      this._setup(options);
      Model.prototype.constructor.apply(this, arguments);
    },
    initialize: noop,
    _initializeModels(options, models) {
      for (const key in models) {
        if (isFunction(models[key].options)) {
          const opts = models[key].options(options);
          this[key] = new models[key].constructor(opts);
        } else if (isObject(models[key].options)) {
          const opts = models[key].options;
          this[key] = new models[key].constructor(opts);
        } else {
          this[key] = new models[key].constructor();
        }
      }
    }
  });

  Tumblr.Fox.register('ControllerModel', Controller);
});
