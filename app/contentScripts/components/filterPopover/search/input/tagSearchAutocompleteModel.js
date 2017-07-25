import $ from 'jquery';
import { Collection } from 'backbone';
import { countBy, identity, invoke } from 'lodash';
import ComponentFetcher from '../../../../utils/componentFetcherUtil';
import ChromeMixin from '../../../mixins/chromeMixin';
import Events from '../../../../application/events';

const AutoComplete = ComponentFetcher.get('AutoComplete');

const TagSearchAutocompleteModel = AutoComplete.extend({
  mixins: [ChromeMixin],
  defaults: {
    matchTerm: '',
    maxRender: 20,
    typeAheadMatches: []
  },
  initialize(options) {
    this.state = options.state;
    this.items = new Collection();
    this.set(this.defaults);
    this.$$rawTags = [];
    this.$$dashboardTags = [];
    this.bindEvents();
    if (!this.state.get('disabled') || !this.state.get('likes')) {
      this.initialFetch();
    }
  },
  bindEvents() {
    this.listenTo(Events, 'fox:updateTags', ::this.getTags);
    this.listenTo(Events, 'fox:changeTerm', ::this.setMatches);
    this.listenTo(Events, 'fox:search:unsetTerm', ::this.onUnsetTermChange);
    this.listenTo(this, 'change:matchTerm sync', ::this.setMatches);
    this.listenTo(this.state, 'change:state', ::this.flushTags);
  },
  unbindEvents() {
    this.stopListening(Events, 'fox:search:unsetTerm');
    this.stopListening(this, 'change:matchTerm');
  },
  getTags(tags) {
    this.$$rawTags = this.$$rawTags.concat(tags.slice(0, tags.length - 1)); // omits loggingData
  },
  processTags(tagCounts) {
    this.$$dashboardTags = [];
    for (const key in tagCounts) {
      const tag = {
        tag: key,
        count: tagCounts[key]
      };
      this.$$dashboardTags.push(tag);
    }
    // forIn(tagCounts, (value, key) => {
    //   const tag = {
    //     tag: key,
    //     count: value
    //   };
    //   this.$$dashboardTags.push(tag);
    // });
  },
  flushTags() {
    this.items.reset([]);
  },
  fetch() { // TODO: get the code for normal autocomplete fetch and add it here so you don't have to do that bogus thing where you switch models
    this.trigger('request');
    if (this.state.get('dashboard')) {
      return this.dashboardFetch();
    } else if (this.state.get('likes')) {
      return this.fetchLikedTags();
    } else if (this.state.get('disabled')) {
      return $.Deferred().reject();
    }
  },
  initialFetch() { // NOTE: if this is empty, fetch tags from the tumblr search bar
    Tumblr.postsView.postViews.filter(post => {
      const tagElems = ($(post.$el) || post.$el).find('.post_tags');
      if (tagElems.length > 0) {
        const rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#');
        rawTags.filter(tag => {
          if (tag !== '') {
            this.$$rawTags.push(tag);
          }
        });
      }
    });
    this.trigger('request');
  },
  dashboardFetch() {
    const deferred = $.Deferred();
    const tagArray = this.$$rawTags;
    const tagCounts = countBy(tagArray, identity);
    this.processTags(tagCounts);
    this.parse(this.$$dashboardTags);
    deferred.resolve(this.items);
    return deferred.promise();
  },
  fetchLikedTags() {
    const deferred = $.Deferred();
    this.chromeTrigger('chrome:fetch:likedTags', tags => {
      this.parse(tags);
      deferred.resolve(tags);
    });
    return deferred.promise();
  },
  fetchTagsByUser() { // NOTE: this might be pointless
    const deferred = $.Deferred();
    this.chromeTrigger('chrome:fetch:tagsByUser', tags => {
      this.parse(tags);
      deferred.resolve(tags);
    });
    return deferred.promise();
  },
  getItems() {
    return this.fetch();
  },
  onUnsetTermChange(e) {
    this.set('matchTerm', e.term);
  },
  hasMatches() {
    return this.items.length || this.get('typeAheadMatches').length;
  },
  setMatches() {
    const term = this.get('matchTerm');
    if (!term.length) {
      this.set('typeAheadMatches', this.items.toJSON());
      return;
    }
    let matches = this.items.toJSON().filter(item => { // NOTE: this is a lodash filter not a normal js filter
      if (item.tag.toLowerCase().includes(term.toLowerCase())) {
        return item;
      }
    });
    this.set('typeAheadMatches', matches);
  },
  parse(tags) {
    this.items.reset(tags);
    this.trigger('sync');
  }
});

module.exports = TagSearchAutocompleteModel;
