module.exports = (function tagSearchAutocompleteModel() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { countBy, identity, invoke, omit, sortBy, uniq } = _;
  const { get } = Tumblr.Fox;

  let TagSearchAutocompleteModel = Backbone.Model.extend({
    defaults: {
      matchTerm: '',
      maxRender: 20,
      typeAheadMatches: [],
      state: {
        likes: !1,
        dashboard: !1,
        user: !0
      }
    },
    initialize(e) {
      this.fetched = !1,
      this.state = this.defaults.state,
      this.items = new Backbone.Collection(),
      this.$$dashboardTags = [],
      this.$$likesTags = [],
      this.bindEvents(),
      this.fetch();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'peeprsearch:change:unsetTerm', ::this.onUnsetTermChange);
      this.listenTo(this, 'change:matchTerm', ::this.setMatches);
    },
    fetch() {
      console.log('[STATE]', this.state);
      if (this.state.dashboard) {
        return this.dashboardFetch();
      } else {
        return this.chromeFetch();
      }
    },
    dashboardFetch() {
      // yes it pulls them off the dom because Tumblr
      let tagArray = [];
      Tumblr.postsView.postViews.filter(post => {
        let tagElems = post.$el.find('.post_tags');
        if (tagElems.length > 0) {
          let rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#');
          rawTags = rawTags.filter(tag => {
            if (tag !== '') {
              tagArray.push(tag);
            }
          });
        }
      });
      let tags = [];
      tagArray = countBy(tagArray, identity);
      for (let key in tagArray) {
        let tag = {
          tag: key,
          count: tagArray[key]
        }
        tags.push(tag);
      }
      this.parse(tags);
      const deferred = $.Deferred();
      deferred.resolve(this.items);
      return deferred.promise();
    },
    chromeFetch() {
      const deferred = $.Deferred();
      const slug = new Event('chrome:fetch:tags');
      window.dispatchEvent(slug);
      window.addEventListener('chrome:response:tags', ::this.parse);
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
      let tags = e.detail || e;
      if (!this.fetched) {
        this.items.reset(tags.slice(0, 250));
      }
      // NOTE: find an elegant way to cache tags
      // if (this.state.dashboard) {
      //   this.$$dashboardTags = this.$$dashboardTags.concat(this.items.models);
      //   this.items.reset(this.$$dashboardTags);
      // }
      this.get('matchTerm') === '' ? this.set('typeAheadMatches', this.items.toJSON()) : null,
      window.removeEventListener('chrome:response:tags', ::this.parse),
      omit(e, 'tags');
    }
  })

  Tumblr.Fox.TagSearchAutocompleteModel = new TagSearchAutocompleteModel();

  return Tumblr.Fox.TagSearchAutocompleteModel;
});
