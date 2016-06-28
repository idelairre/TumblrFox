import $ from 'jquery';
import { isBoolean, mapKeys } from 'lodash';
import Backbone from 'backbone';
import View from '../../view/view';
import Tipped from '../../../lib/tipped';
import experimentalTemplate from './experimental.html';
import clientCachingTooltip from './tooltips/clientCachingTooltip.html';
import fullTextSearchTooltip from './tooltips/fullTextSearchTooltip.html';
import saveViaFirebaseTooltip from './tooltips/saveViaFirebaseTooltip.html';

const Experimental = View.extend({
  defaults: {
    props: {
      fullTextSearch: false,
      saveViaFirebase: false
    }
  },
  template: $(experimentalTemplate).html(),
  className: 'experimental options',
  tagName: 'section',
  render() {
    this.$el.html(this.template);
    this.bindEvents();
    return this;
  },
  events: {
    'click [type=checkbox]': 'toggleCheck'
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', this.renderProps);
  },
  afterRender() {
    setTimeout(() => {
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
  },
  renderProps(props) {
    mapKeys(props, (value, key) => {
      if (isBoolean(value) && this.$el.find(`input#${key}`).attr('type') === 'checkbox') {
        this.$el.find(`input#${key}`).attr('checked', value);
      }
    });
  }
});

export default Experimental;
