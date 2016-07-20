import { $, View, Model } from 'backbone';
import { template, pick } from 'lodash';
import Events from '../../application/events';
import SearchModel from '../filterPopover/search/searchModel';
import searchResultsTemplate from './searchResultsTemplate.html';

const SearchResults = View.extend({
  template: template(searchResultsTemplate),
  className: 'search_posts_bottom',
  initialize(options) {
    Object.assign(this, pick(options, ['searchModel', 'state']));
    this.searchModel = this.searchModel || SearchModel;
    this.bindEvents();
    this.status = new Model({
      visible: false
    });
    this.render();
  },
  set(key, value) {
    this.status.set(key, value);
  },
  get(key) {
    return this.status.get(key);
  },
  bindEvents() {
    this.listenTo(this.searchModel, 'change', ::this.renderTerm);
    this.listenTo(Events, 'fox:search:complete', ::this.show);
    this.listenTo(Events, 'fox:search:renderedResults', ::this.show);
    this.listenTo(Events, 'fox:search:start', ::this.hide);
  },
  hide() {
    if (this.get('visible')) {
      this.$el.hide();
      this.set('visible', false);
    }
  },
  show() {
    if (!this.get('visible')) {
      if (this.searchModel.get('term').length > 0) {
        this.$el.show();
      } else {
        this.$el.find('.results_end_body').text('That\'s it! Try another search?');
        this.$el.show();
      }
      this.set('visible', true);
    }
  },
  renderTerm() {
    const term = this.searchModel.get('term');
    this.$('span.search_query_highlight').text(term);
    this.$el.hide();
    this.set('visible', false);
  },
  render() {
    this.$el.html(this.template({
      term: this.searchModel.get('term')
    }));
    $('#posts').append(this.$el);
    this.$el.hide();
    this.set('visible', false);
  }
});

module.exports = SearchResults
