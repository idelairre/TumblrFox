import $ from 'jquery';
import { isString, mapKeys } from 'lodash';
import Backbone from 'backbone';
import authenticationTemplate from './authentication.html';

const Authentication = Backbone.View.extend({
  template: $(authenticationTemplate).html(),
  className: 'authentication options',
  tagName: 'section',
  initialize(e) {
    this.props = e;
  },
  render() {
    this.rendered = true;
    this.$el.html(this.template);
    Backbone.View.prototype.render.apply(this, arguments);
    this.bindEvents();
    this.$el.hide();
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', this.renderProps);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', this.setProps);
    this.listenTo(this.props, 'change', this.toggleState);
  },
  setProps(newProps) {
    this.props.set(newProps);
    console.log('[SETTING NEW PROPS]');
  },
  renderProps() {
    mapKeys(this.props.attributes, (value, key) => {
      if (isString(value)) {
        this.$el.find(`input#${key}`).val(value);
      }
    });
    this.toggleState();
  },
  toggleState() {
    this.toggleUserInputVisibity();
    this.toggleKeyInputVisibility();
    this.toggleAuthDivVisibility();
  },
  toggleUserInputVisibity() {
    if (this.props.get('setUser')) {
      this.$('.user').show();
    } else {
      this.$('.user').hide();
    }
  },
  toggleKeyInputVisibility() {
    if (this.props.get('defaultKeys')) {
      this.$('.consumer-secret').hide();
      this.$('.consumer-key').hide();
    } else {
      this.$('.consumer-secret').show();
      this.$('.consumer-key').show();
    }
  },
  toggleAuthDivVisibility() {
    if (!this.props.get('setUser') && this.props.get('defaultKeys')) {
      this.$el.hide();
    }
    if (!this.props.get('defaultKeys') || this.props.get('setUser')) {
      this.$el.show();
    }
  }
});

export default Authentication;
