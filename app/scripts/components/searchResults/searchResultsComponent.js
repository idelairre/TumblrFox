module.exports = (function searchResults() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { template } = _;

  const SearchResults = Backbone.View.extend({
    defaults: {
      initialized: !1
    },
    template: template($('#searchResultsTemplate').html()),
    className: 'search_posts_bottom',
    initialize(e) {
      this.options = Object.assign({}, e, this.defaults);
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', this.hide);
      this.listenTo(Tumblr.Events, 'indashblog:search:results-end', this.update);
      this.listenTo(Tumblr.Events, 'fox:searchLikes:finished', this.update);
      this.listenTo(Tumblr.Events, 'fox:postFetch:empty', this.update);
    },
    hide() {
      console.log('[SEARCH RESULTS HIDE]');
      if (this.initialized) {
        this.$el.hide();
      }
    },
    show() {
      console.log('[SEARCH RESULTS SHOW]');
      this.$el.show();
    },
    update(query) {
      query = query || Tumblr.Fox.Posts.query.loggingData;
      if (!this.initialized) {
        this.render(query);
      } else {
        this.$('span.search_query_highlight').text(query.term);
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

  return Tumblr.Fox.SearchResults;
});
