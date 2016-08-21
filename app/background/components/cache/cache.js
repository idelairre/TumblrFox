import $ from 'jquery';
import Backbone, { Model } from 'backbone';
import template from 'lodash.template';
import snakeCase from '../../utils/snakeCase';
import Tipped from '../../lib/tipped';
import View from '../view/view';
import cacheTemplate from './cache.html';
import cacheTooltip from './tooltips/cacheTooltip.html';

const Cache = View.extend({
  defaults: {
    props: {
      cachedLikesCount: 0,
      cachedFollowingCount: 0,
      cachedPostsCount: 0,
      cachedTagsCount: 0,
      totalLikesCount: 0,
      totalFollowingCount: 0,
      totalTagsCount: 0,
      totalPostsCount: 0
    }
  },
  template: template(cacheTemplate),
  className: 'cache options',
  tagName: 'section',
  events() {
    return {
      'click button': 'handleButton',
      'change [type=select]': 'pageChange',
      'change [type=date]': 'dateChange'
    }
  },
  initialize() {
    const maxPages = this.props.get('totalLikesCount') / 50;
    this.pageOpts = [];
    for (let i = 0; maxPages > i; i += 50) {
      this.pageOpts.unshift(i);
    }
    this.pageOpts.unshift('max');
    this.pageOpts = this.pageOpts.reverse();

    this.model = new Model({
      page: 'max',
      date: new Date(2007, 1, 1)
    });
  },
  bindEvents() {
    this.listenTo(this.model, 'change', ::this.props.set('likeSourceLimits', this.model.toJSON()));
  },
  render() {
    this.$el.html(this.template(this.props.attributes));
    this.$date = this.$('[type=date]');
    this.$page = this.$('.page-num');
    this.$date.val(this.toDateInputValue(this.model.get('date')));
    this.renderPageOpts();
    this.bindEvents();
  },
  renderPageOpts() {
    const pageOpts = this.pageOpts.map(opt => {
      return `<option value=${opt}>${opt}</option>`;
    }).join('');
    this.$('select').append($(pageOpts));
    this.$('select').val('max');
  },
  afterRender() {
    setTimeout(() => {
      Tipped.create('[data-tooltip-key="caching"]', $(cacheTooltip).html(), {
        skin: 'light', position: 'topleft', behavior: 'hide'
      });
    });
  },
  handleButton(e) {
    e.preventDefault();
    const key = this.$(e.currentTarget).prop('id');
    const eventName = snakeCase(key).toUpperCase();
    Backbone.Events.trigger(eventName, {
      type: key
    });
  },
  toDateInputValue(date) {
    const now = new Date();
    const local = new Date(date);
    local.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
  },
  pageChange(e) {
    let val = $(e.currentTarget).val();
    if (parseInt(val)) {
      val = parseInt(val);
    }
    this.model.set('page', val);
  },
  dateChange(e) {
    const date = Date.parse($(e.currentTarget).val());
    this.model.set('date', date);
  },
  renderProps(props) {
    Object.keys(props).forEach(key => {
      if (typeof value === 'number') {
        this.$el.find(`span#${key}`).text(props[key]);
      }
    });
  }
});

export default Cache;
