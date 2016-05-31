import { bind, each, extend, isFunction, noop, pick, result, union } from 'lodash';

const assignProps = (target, source) => {
  if (!target) {
    return;
  }
  for (const key in source) {
    if (target.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
  return target;
}

const View = Backbone.View.extend({
  defaults: {},
  rendered: false,
  constructor(props) {
    if (!props) {
      return;
    }
    const _props = assignProps(this.defaults.props, props);
    this.props = new Backbone.Model(_props);
    this.attributes = {};
    Backbone.View.prototype.constructor.call(this, props);
    this._setup();
  },
  _setup() {
    // const e = extend({}, result(this.constructor.__super__, 'defaults'), result(this, 'defaults'));
    let render = this.render;
    this.render = bind(() => {
      this._beforeRender.apply(this, arguments);
      this.beforeRender.apply(this, arguments);
      render = render.apply(this, arguments);
      this.initialize.apply(this, arguments);
      this.afterRender.apply(this, arguments);
      this._afterRender.apply(this, arguments);
      this.renderProps.apply(this);
      return render;
    });
    this.renderProps = this.renderProps.bind(this, this.props.attributes);
    this._bindListeners();
  },
  _bindListeners() {
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', ::this.setProps);
  },
  initialize: noop,
  afterRender: noop,
  _afterRender() {
    this.rendered = true;
    this.initialized = true;
    this.trigger('rendered', this);
  },
  beforeRender: noop,
  _beforeRender: noop,
  setProps(newProps) {
    assignProps(this.props.attributes, newProps);
    this.props.set(this.props.attributes);
    this.renderProps();
  },
  renderProps: noop
});

export default View;
