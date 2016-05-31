import $ from 'jquery';
import { isNumber, mapKeys, snakeCase, toUpper } from 'lodash';
import Backbone from 'backbone';
import View from '../view/view';
import cacheTemplate from './cache.html';
import cacheTooltip from './tooltips/cacheTooltip.html';
import Tipped from '../../lib/tipped';

const Cache = View.extend({
  defaults: {
    props: {
      cachedPostsCount: 0,
      cachedFollowingCount: 0,
      cachedTagsCount: 0,
      totalPostsCount: 0,
      totalFollowingCount: 0,
      totalTagsCount: 0
    }
  },
  template: $(cacheTemplate).html(),
  className: 'cache options',
  tagName: 'section',
  render() {
    this.$el.html(this.template);
    console.log(this);
    return this;
  },
  afterRender() {
    setTimeout(() => {
      Tipped.create('[data-tooltip-key="caching"]', $(cacheTooltip).html(), {
        skin: 'light', position: 'topleft', behavior: 'hide'
      });
    });
  },
  events: {
    'click button': 'toggleButton'
  },
  toggleButton(e) {
    console.log('[BUTTON PRESS]');
    const key = this.$(e.currentTarget).prop('id');
    const event = toUpper(snakeCase(key));
    Backbone.Events.trigger(event, {
      type: key
    });
  },
  renderProps(props) {
    console.log('[RENDER PROPS]', props, this);
    mapKeys(props, (value, key) => {
      if (isNumber(value)) {
        this.$el.find(`span#${key}`).text(value);
      }
    });
  }
});

export default Cache;
