module.exports = (function dashboardSearchAutocompleteModel() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { invoke, omit, sortBy } = _;
  const { get } = Tumblr.Fox;

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
      this.listenTo(Tumblr.Events, 'peeprsearch:change:unsetTerm', ::this.onUnsetTermChange);
      this.listenTo(this, 'change:matchTerm', ::this.setMatches);
    },
    fetch() {
      const deferred = $.Deferred();
      if (!this.fetched) {
        const slug = new Event('chrome:fetch:tags');
        window.dispatchEvent(slug);
      }
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
      if (!this.fetched) {
        this.items.reset(e.detail.slice(0, 250));
        this.fetched = !0;
      }
      this.get('matchTerm') === '' ? this.set('typeAheadMatches', this.items.toJSON()) : null,
      window.removeEventListener('chrome:response:tags', ::this.parse),
      omit(e, 'tags');
    }
  })

  Tumblr.Fox.DashboardSearchAutocompleteModel = new DashboardSearchAutocompleteModel();

  return Tumblr.Fox.DashboardSearchAutocompleteModel;
});
