module.exports = (function tagSearchAutocompleteModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { countBy, identity, invoke, forIn, omit } = _;
  const { get } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  const TagSearchAutocompleteModel = Model.extend({
    mixins: [ChromeMixin],
    defaults: {
      matchTerm: '',
      maxRender: 20,
      typeAheadMatches: []
    },
    initialize(options) {
      this.fetched = false;
      this.state = options.state;
      this.items = new Backbone.Collection();
      this.$$rawTags = [];
      this.$$dashboardTags = [];
      this.bindEvents();
      this.initialFetch();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:setSearchOption', ::this.setState);
      this.listenTo(Tumblr.Events, 'fox:updateTags', ::this.getTags);
      this.listenTo(Tumblr.Events, 'peeprsearch:change:unsetTerm', ::this.onUnsetTermChange);
      this.listenTo(this, 'change:matchTerm', ::this.setMatches);
      this.listenTo(this.state, 'change:state', ::this.flushTags);
    },
    unbindEvents() {
      this.stopListening(Tumblr.Events, 'peeprsearch:change:unsetTerm');
      this.stopListening(this, 'change:matchTerm');
    },
    setState(state) {
      console.log('[STATE]', state);
      switch (state) {
        case 'text':
          this.unbindEvents();
          break;
        case 'tag':
          this.bindEvents();
          break;
      }
    },
    getTags(tags) {
      this.$$rawTags = this.$$rawTags.concat(tags.slice(0, tags.length - 1));
    },
    processTags(tagArray, tagCounts) {
      tagArray.map(rawTag => {
        const tag = {
          tag: rawTag,
          count: tagCounts[rawTag]
        };
        this.$$dashboardTags.push(tag);
      });
    },
    flushTags(state) {
      this.fetched = false;
      this.items.reset([]);
    },
    fetch() {
      if (this.state.get('dashboard')) {
        return this.dashboardFetch();
      }
      return this.chromeFetch();
    },
    initialFetch() {
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
    },
    // NOTE: sometimes doesn't fetch new tags after API fetch and having initially fetched dashboard tags
    // need a trigger to flush tags
    dashboardFetch() {
      console.log('[FETCHING TAGS], raw tags: ', this.$$rawTags.length, 'parsed tags: ', this.$$dashboardTags.length);
      const deferred = $.Deferred();
      const tagArray = this.$$rawTags;
      const tagCounts = countBy(tagArray, identity);
      this.processTags(tagArray, tagCounts);
      this.parse(this.$$dashboardTags);
      return deferred.resolve(this.items);
    },
    chromeFetch() {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:tags', tags => {
        this.parse(tags);
        deferred.resolve(tags);
      });
      return deferred.promise();
    },
    getItems() {
      return this.fetch(arguments);
    },
    onUnsetTermChange(e) {
      this.set('matchTerm', e.term);
    },
    hasMatches() {
      return this.items.length && this.get('typeAheadMatches').length || this.fetched;
    },
    setMatches() {
      const term = this.get('matchTerm');
      const matches = this.items.filter(tag => {
        return tag.get('tag').indexOf(term) > -1;
      });
      this.set('typeAheadMatches', invoke(matches, 'toJSON'));
    },
    parse(e) {
      let tags = e.detail || e;
      if (!this.fetched) {
        this.items.reset(tags);
        this.fetched = true;
      }
      if (this.get('matchTerm') === '') {
         this.set('typeAheadMatches', this.items.toJSON());
       }
      omit(e, 'tags');
      // console.log('[RAW TAGS]', this.$$rawTags, this.$$dashboardTags);
    }
  });

  Tumblr.Fox.register('TagSearchAutocompleteModel', TagSearchAutocompleteModel);
});
