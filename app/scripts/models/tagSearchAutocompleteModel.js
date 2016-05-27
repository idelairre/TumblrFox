module.exports = (function tagSearchAutocompleteModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { countBy, identity, invoke, omit } = _;
  const { chromeMixin } = Tumblr.Fox;

  const TagSearchAutocompleteModel = Backbone.Model.extend({
    mixins: [chromeMixin],
    defaults: {
      matchTerm: '',
      maxRender: 20,
      typeAheadMatches: []
    },
    initialize() {
      this.fetched = !1;
      this.state = Tumblr.Fox.state;
      this.items = new Backbone.Collection();
      this.$$dashboardTags = [];
      this.$$likesTags = [];
      this.bindEvents();
      this.chromeTrigger('chrome:fetch:tags', ::this.parse);
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'fox:setSearchOption', ::this.setState);
      this.listenTo(Tumblr.Events, 'peeprsearch:change:unsetTerm', ::this.onUnsetTermChange);
      this.listenTo(this, 'change:matchTerm', ::this.setMatches);
    },
    unbindEvents() {
      this.stopListening(Tumblr.Events, 'peeprsearch:change:unsetTerm');
      this.stopListening(this, 'change:matchTerm');
    },
    setState(state) {
      switch (state) {
        case 'text':
          this.unbindEvents();
          break;
        case 'tag':
          this.bindEvents();
          break;
      }
    },
    fetch() {
      if (this.state.get('dashboard')) {
        return this.dashboardFetch();
      } else {
        return this.chromeFetch();
      }
    },
    // NOTE: sometimes doesn't fetch new tags after API fetch and having initially fetched dashboard tags
    // need a trigger to flush tags
    dashboardFetch() {
      const tagArray = [];
      const deferred = $.Deferred();
      deferred.resolve(this.items);
      if (Tumblr.Fox.Posts.state.dashboardSearch) { // return early
        return deferred.promise();
      }
      Tumblr.postsView.postViews.filter(post => {
        const tagElems = post.$el.find('.post_tags');
        if (tagElems.length > 0) {
          let rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#');
          rawTags = rawTags.filter(tag => {
            if (tag !== '') {
              tagArray.push(tag);
            }
          });
        }
      });
      const tags = [];
      const tagCounts = countBy(tagArray, identity);
      for (const key in tagCounts) {
        if ({}.hasOwnProperty.call(tagCounts, key)) {
          const tag = {
            tag: key,
            count: tagCounts[key]
          };
          tags.push(tag);
        }
      }
      this.parse(tags);
      return deferred.promise();
    },
    chromeFetch() {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:tags', ::this.parse);
      deferred.resolve(this.items);
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
      const tags = e.detail || e;
      if (!this.fetched) {
        this.items.reset(tags.slice(0, 250));
      }
      if (this.get('matchTerm') === '') {
         this.set('typeAheadMatches', this.items.toJSON());
       }
      omit(e, 'tags');
    }
  });

  Tumblr.Fox.TagSearchAutocompleteModel = new TagSearchAutocompleteModel();
});
