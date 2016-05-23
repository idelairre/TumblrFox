import $ from 'jquery';
import { isBoolean, mapKeys } from 'lodash';
import Backbone from 'backbone';
import experimentalTemplate from './experimental.html';
import cacheTooltip from './tooltips/cacheTooltip.html';
import clientCachingTooltip from './tooltips/clientCachingTooltip.html';
import fullTextSearchTooltip from './tooltips/fullTextSearchTooltip.html';
import saveViaFirebaseTooltip from './tooltips/saveViaFirebaseTooltip.html';
import Tipped from '../tipped';

const Experimental = Backbone.View.extend({
  template: $(experimentalTemplate).html(),
  className: 'experimental options',
  tagName: 'section',
  initialize(e) {
    this.props = e;
  },
  render() {
    this.port = chrome.runtime.connect({
      name: 'options'
    });
    this.rendered = true;
    this.$el.html(this.template);
    Backbone.View.prototype.render.apply(this, arguments);
    this.afterRender();
    this.bindEvents();
  },
  events: {
    'click [type=checkbox]': 'toggleCheck'
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', this.renderProps);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', ::this.setProps);
    this.listenTo(this.props, 'change', ::this.renderProps);
  },
  afterRender() {
    setTimeout(() => {
      Tipped.create('[data-tooltip-key="clientCaching"]', $(cacheTooltip).html(), {
        skin: 'light', position: 'topleft', behavior: 'hide'
      });
      Tipped.create('[data-tooltip-key="fullTextSearch"]', $(fullTextSearchTooltip).html(), {
        skin: 'light', position: 'bottomleft', behavior: 'hide'
      });
      Tipped.create('[data-tooltip-key="clientCaching"]', $(clientCachingTooltip).html(), {
        skin: 'light', position: 'topleft', behavior: 'hide'
      });
      Tipped.create('[data-tooltip-key="saveViaFirebase"]', $(saveViaFirebaseTooltip).html(), {
        skin: 'light', position: 'bottomleft', behavior: 'hide'
      });
    });
  },
  toggleCheck(e) {
    const check = e.target.checked;
    const key = this.$(e.currentTarget).prop('id');
    this.props.set(key, check);
    Backbone.Events.trigger('CHANGE_PROPS', this.props.attributes);
  },
  setProps(newProps) {
    this.props.set(newProps);
  },
  renderProps() {
    mapKeys(this.props.attributes, (value, key) => {
      if (isBoolean(value) && this.$el.find(`input#${key}`).attr('type') === 'checkbox') {
        this.$el.find(`input#${key}`).attr('checked', value);
      }
    });
  }
});

export default Experimental;
