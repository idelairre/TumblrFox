import $ from 'jquery';
import { template } from 'lodash';
import Backbone from 'backbone';
import modalTemplate from './modal.html';
import './modal.less';

const Modal = Backbone.View.extend({
  className: 'modal',
  template: template($(modalTemplate).html()),
  initialize(e) {
    this.options = Object.assign({}, e);
    this.$parent = this.options.parent;
  },
  events: {
    'click .modal-close-button': 'hide',
    'click .modal-close-button-lg': 'hide'
  },
  render() {
    this.$el.html(this.template(this.options));
    this.$content = this.$('#content');
    this.$close = this.$('#close');
    this.center();
    return this;
  },
  center() {
    this.$el.css({
      position: 'absolute',
      top: '50%'
    });
  },
  show() {
    this.$el.fadeIn(100);
  },
  hide() {
    this.$el.fadeOut(100);
  }
});

export default Modal;
