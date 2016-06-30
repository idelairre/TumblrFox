module.exports = (function tagSearchAutocompleteModel(Tumblr, Backbone, _, AutoComplete, ChromeMixin) {
  const { $, Collection, Model } = Backbone;
  const { countBy, identity, invoke, forIn, omit } = _;

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
      if (!this.state.get('disabled')) {
        this.initialFetch();
      }
    },
    bindEvents() {
      this.listenTo(Tumblr.Fox.Events, 'fox:updateTags', ::this.getTags);
      this.listenTo(Tumblr.Fox.Events, 'fox:changeTerm', ::this.setMatches);
      this.listenTo(Tumblr.Fox.Events, 'fox:search:unsetTerm', ::this.onUnsetTermChange);
      this.listenTo(this, 'change:matchTerm sync', ::this.setMatches);
      this.listenTo(this.state, 'change:state', ::this.flushTags);
    },
    unbindEvents() {
      this.stopListening(Tumblr.Fox.Events, 'fox:search:unsetTerm');
      this.stopListening(this, 'change:matchTerm');
    },
    getTags(tags) {
      this.$$rawTags = this.$$rawTags.concat(tags.slice(0, tags.length - 1)); // omits loggingData
    },
    processTags(tagCounts) {
      this.$$dashboardTags = [];
      forIn(tagCounts, (value, key) => {
        const tag = {
          tag: key,
          count: value
        };
        this.$$dashboardTags.push(tag);
      });
    },
    flushTags() {
      this.items.reset([]);
    },
    fetch() {
      this.trigger('request');
      if (this.state.get('dashboard')) {
        return this.dashboardFetch();
      } else if (this.state.get('likes')) {
        return this.fetchLikedTags();
      } else if (this.state.get('disabled')) {
        return $.Deferred().reject();
      }
      return this.fetchTagsFromLikes();
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
    fetchTagsByUser() {
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
      return this.items.length && this.get('typeAheadMatches').length;
    },
    setMatches() {
      const term = this.get('matchTerm');
      if (!term.length) {
        this.set('typeAheadMatches', this.items.toJSON());
        return;
      }
      const matches = this.items.filter(tag => { // NOTE: this is a lodash filter not a normal js filter
        return tag.get('tag').toLowerCase().includes(term.toLowerCase());
      });
      this.set('typeAheadMatches', invoke(matches, 'toJSON'));
    },
    parse(tags) {
      this.items.reset(tags);
      this.trigger('sync');
    }
  });

  Tumblr.Fox.register('TagSearchAutocompleteModel', TagSearchAutocompleteModel);

});
