module.exports = (function dashboardSearchAutocompleteModel() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { invoke, omit } = _;
  const { get } = Tumblr.Fox;
  const AutoComplete = get('AutoComplete');

  let DashboardSearchAutocompleteModel = Backbone.Model.extend({
    defaults: {
      matchTerm: '',
      maxRender: 20,
      typeAheadMatches: []
    },
    initialize(e) {
      this.fetched = !1,
      this.items = new Backbone.Collection(),
      this.bindEvents(),
      this.fetch();
    },
    bindEvents() {
      window.addEventListener('chrome:response:tags', ::this.parse),
      this.listenTo(Tumblr.Events, 'peeprsearch:change:unsetTerm', ::this.onUnsetTermChange),
      this.listenTo(this, 'change:matchTerm', ::this.setMatches);
    },
    fetch() {
      const deferred = $.Deferred();
      const slug = new Event('chrome:fetch:tags');
      window.dispatchEvent(slug);
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
      return this.items.length && this.get('typeAheadMatches').length || !!this.fetched;
    },
    setMatches() {
      const term = this.get('matchTerm');
      if (!term.length) {
        return this.set('typeAheadMatches', this.items.toJSON());
      }
      const matches = this.items.filter(tag => {
        return tag.get('tag').indexOf(term) > -1;
      });
      this.set('typeAheadMatches', invoke(matches, 'toJSON'));
    },
    parse(e) {
      return this.items.reset(e.detail),
      this.fetched = !0,
      this.get('matchTerm') === '' ? this.set('typeAheadMatches', invoke(this.items.filter(tag => {
        return tag.get('count') > 1;
      }), 'toJSON')) : null,
      omit(e, 'tags');
    }
  })

  Tumblr.Fox.DashboardSearchAutocompleteModel = DashboardSearchAutocompleteModel;

  return Tumblr;
});
