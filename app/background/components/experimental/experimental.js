import $ from 'jquery';
import Backbone from 'backbone';
import template from 'lodash.template';
import Tipped from '../../lib/tipped';
import View from '../view/view';
import autoCacheLikesTooltip from './tooltips/autoCacheLikesTooltip.html';
import autoCacheUserPostsTooltip from './tooltips/autoCacheUserPostsTooltip.html';
import experimentalTemplate from './experimental.html';
import saveViaFirebaseTooltip from './tooltips/saveViaFirebaseTooltip.html';

const Experimental = View.extend({
  defaults: {
    props: {
      autoCacheLikes: false,
      autoCacheUserPosts: false,
      saveViaFirebase: false
    }
  },
  template: template(experimentalTemplate),
  className: 'experimental',
  tagName: 'section',
  render() {
    this.$el.html(this.template(this.props.attributes));
    this.bindEvents();
  },
  events: {
    'click [type=checkbox]': 'toggleCheck'
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', this.renderProps);
  },
  afterRender() {
    Tipped.create('[data-tooltip-key="autoCacheLikes"]', $(autoCacheLikesTooltip).html(), {
      skin: 'light', position: 'bottomleft', behavior: 'hide'
    });
    Tipped.create('[data-tooltip-key="autoCacheUserPosts"]', $(autoCacheUserPostsTooltip).html(), {
      skin: 'light', position: 'bottomleft', behavior: 'hide'
    });
    Tipped.create('[data-tooltip-key="saveViaFirebase"]', $(saveViaFirebaseTooltip).html(), {
      skin: 'light', position: 'bottomleft', behavior: 'hide'
    });
  },
  toggleCheck(e) {
    const check = e.target.checked;
    const key = this.$(e.currentTarget).prop('id');
    this.props.set(key, check);
  }
});

export default Experimental;
