import App from '../../app';
import { Model } from 'backbone';
import { isFunction, isObject, noop } from 'lodash';

const modelInstances = {};

const Controller = Model.extend({
  _setup(options) {
    options = options || {};
    this.models = Object.assign({}, this.models, options.models);
    this._initializeModels(options, this.models);
  },
  constructor(options) {
    this._setup(options);
    Model.prototype.constructor.apply(this, arguments);
    App.Controllers = App.Controllers || {};
    App.Controllers[options.name || this.cid] = this;
  },
  add(name, model) {
    modelInstances[name] = model;
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
      this.add(key, this[key]);
    }
  }
});

module.exports = Controller;
