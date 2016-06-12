module.exports = (function searchResults(Tumblr, Backbone, _) {
  const { $, View } = Backbone;
  const { assign, template, isObject } = _;
  const { Utils } = Tumblr.Fox;

  const SearchResults = View.extend({
    defaults: {
      initialized: false,
      term: ''
    },
    template: template(Utils.TemplateCache.get('searchResultsTemplate')),
    className: 'search_posts_bottom',
    initialize(e) {
      this.initialized = false;
      this.options = assign({}, e, this.defaults);
      this.bindEvents();
    },
    bindEvents() {
      // this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.hide);
      // this.listenTo(Tumblr.Events, 'indashblog:search:results-end', this.update);
      // this.listenTo(Tumblr.Events, 'fox:filterFetch:started', this.hide);
      // this.listenTo(Tumblr.Events, 'fox:search:finished', this.update);
      // this.listenTo(Tumblr.Events, 'fox:postFetch:empty', this.update);
    },
    hide(e) {
      console.log('[SEARCH RESULTS HIDE]', e);
      if (this.initialized) {
        this.$el.hide();
      }
    },
    show() {
      console.log('[SEARCH RESULTS SHOW]');
      this.$el.show();
    },
    update(query) {
      console.log('[QUERY]', query);
      // this.renderTerm(term);
    },
    setTerm(e) {
      this.options.term = e.term;
    },
    renderTerm(term) {
      if (!this.initialized) {
        this.render({ term });
      } else {
        this.$('span.search_query_highlight').text(term);
        this.show();
      }
    },
    render(query) {
      this.initialized = true;
      this.$el = this.$el.html(this.template(query));
      $('#posts').append(this.$el);
    }
  });

  Tumblr.Fox.register('SearchResults', SearchResults);
});
