module.exports = (function searchResults(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { assign, template, isObject } = _;

  const SearchResults = Backbone.View.extend({
    defaults: {
      initialized: false,
      term: ''
    },
    template: template($('#searchResultsTemplate').html()),
    className: 'search_posts_bottom',
    initialize(e) {
      this.options = assign({}, e, this.defaults);
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'peeprsearch:change:unsetTerm', ::this.setTerm)
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.hide);
      this.listenTo(Tumblr.Events, 'indashblog:search:results-end', this.update);
      this.listenTo(Tumblr.Events, 'fox:filterFetch:started', this.hide);
      this.listenTo(Tumblr.Events, 'fox:search:finished', this.update);
      this.listenTo(Tumblr.Events, 'fox:postFetch:empty', this.update);
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
      let term = ''
      if (query instanceof Backbone.Model) {
        term = query.model.get('term');
      } else if (query === null) {
        term = this.options.term;
      } else {
        term = query.term;
      }
      this.renderTerm(term);
    },
    setTerm(e) {
      this.options.term = e.term;
      // console.log(this.options, e, this.term);
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
      this.initialized = !0;
      this.$el = this.$el.html(this.template(query));
      $('#posts').append(this.$el);
    }
  });

  Tumblr.Fox.SearchResults = new SearchResults();
});
