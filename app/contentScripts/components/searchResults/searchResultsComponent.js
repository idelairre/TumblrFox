module.exports = (function searchResults(Tumblr, Backbone, _) {
  const { $, View, Model } = Backbone;
  const { template } = _;
  const { TemplateCache } = Tumblr.Fox.Utils;

  const SearchResults = View.extend({
    template: template(TemplateCache.get('searchResultsTemplate')),
    className: 'search_posts_bottom',
    initialize(options) {
      this.blogModel = options.blogModel;
      this.bindEvents();
      this.state = new Model({
        visible: false
      });
      this.render();
    },
    set(key, value) {
      this.state.set(key, value);
    },
    get(key) {
      return this.state.get(key);
    },
    bindEvents() {
      this.listenTo(this.blogModel, 'change', ::this.renderTerm);
      this.listenTo(Tumblr.Events, 'fox:search:renderedResults', ::this.show);
      this.listenTo(Tumblr.Events, 'fox:search:finished', ::this.show);
      this.listenTo(Tumblr.Events, 'fox:search:started', ::this.hide);
    },
    hide() {
      if (this.get('visible')) {
        this.$el.hide();
        this.set('visible', false);
      }
    },
    show() {
      if (!this.get('visible')) {
        this.$el.show();
        this.set('visible', true);
      }
    },
    renderTerm() {
      const term = this.blogModel.get('term');
      this.$('span.search_query_highlight').text(term);
    },
    render() {
      this.$el.html(this.template({
        term: this.blogModel.get('term')
      }));
      $('#posts').append(this.$el);
      this.$el.hide();
      this.set('visible', false);
    }
  });

  Tumblr.Fox.register('SearchResultsComponent', SearchResults);
});
