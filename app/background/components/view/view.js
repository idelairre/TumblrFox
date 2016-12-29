import Backbone, { Events, Model } from 'backbone';

const assignProps = (target, source) => {
  if (!target || !source) {
    throw new Error('Invalid arguments');
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
    if (props && this.defaults.props) {
      const _props = assignProps(this.defaults.props, props);
      this.props = new Model(_props);
    }
    this.attributes = {};
    Backbone.View.call(this, props);
    this._setup.call(this);
  },
  _setup() {
    this.rendered = false;
    const render = this.render;
    this.render = function() {
      this.beforeRender.apply(this, arguments);
      render.apply(this, arguments);
      setTimeout(() => {
        this.afterRender.apply(this, arguments);
        this._afterRender.apply(this, arguments);
      }, 0);
    };
    const remove = this.remove;
    this.remove = function() {
      this.afterRemove.apply(this, arguments);
      this._afterRemove.apply(this, arguments);
      remove.apply(this, arguments);
    }
    this._bindListeners();
  },
  _bindListeners() {
    this.listenTo(Events, 'CHANGE_PROPS', props => {
      if (this.props) {
        this.props.set(props, { silent: true });
        this.render();
      }
    });
    if (this.props) {
      this.listenTo(this.props, 'change', () => {
        Events.trigger('CHANGE_PROPS', this.props.changedAttributes());
      });
    }
  },
  initialize: Function.prototype,
  afterRender: Function.prototype,
  _afterRender() {
    this.rendered = true;
    this.trigger('rendered', this);
  },
  beforeRender: Function.prototype,
  render: Function.prototype,
  _afterRemove() {
    this.stopListening(Events);
  },
  remove() {
    Backbone.View.prototype.remove.apply(this, arguments);
  },
  afterRemove: Function.prototype
});

export default View;
