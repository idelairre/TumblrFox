import Backbone, { Model } from 'backbone';

const assignProps = (target, source) => {
  if (!target) {
    return;
  }
  for (const key in source) {
    if ({}.hasOwnProperty.call(target, key)) {
      target[key] = source[key];
    }
  }
  return target;
};

const View = Backbone.View.extend({
  defaults: {},
  rendered: false,
  constructor(props) {
    if (!props) {
      return;
    }
    const _props = assignProps(this.defaults.props, props);
    this.props = new Model(_props);
    this.attributes = {};
    Backbone.View.call(this, props);
    this._setup.call(this);
  },
  _setup() {
    this.rendered = false;
    let render = this.render;
    this.render = function() {
      this._beforeRender.apply(this, arguments);
      this.beforeRender.apply(this, arguments);
      render.apply(this, arguments);
      setTimeout(() => {
        this.afterRender.apply(this, arguments);
        this._afterRender.apply(this, arguments);
      }, 0);
    };
    this._bindListeners();
  },
  _bindListeners() {
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', ::this.setProps);
    this.listenTo(this.props, 'change', () => {
      if (this.rendered) {
        Backbone.Events.trigger('CHANGE_PROPS', this.props.toJSON());
      }
    });
  },
  initialize: Function.prototype,
  afterRender: Function.prototype,
  _afterRender() {
    this.rendered = true;
    this.trigger('rendered', this);
  },
  beforeRender: Function.prototype,
  _beforeRender: Function.prototype,
  render: Function.prototype,
  setProps(newProps) {
    assignProps(this.props.attributes, newProps);
    this.props.set(this.props.attributes);
    this.render();
  },
});

export default View;
