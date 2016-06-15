module.exports = (function (Tumblr, Backbone, _) {
  const { $, Collection, Model } = Backbone;
  const { assign, pick } = _;
  const { Utils } = Tumblr.Fox;

  const Search = Model.extend({
    defaults: {
      count: 0,
      limit: 12
    },
    initialize(options) {
      assign(this, pick(options, 'state'));
      this.matches = new Collection();
      this.set(this.defaults);
      this.bindEvents();
    },
    bindEvents() {
      console.log('[BINDING SEARCH EVENTS]');
      this.listenTo(this.matches, 'all', (eventName, model) => {
        this.trigger(eventName, model);
      });
      this.listenTo(Tumblr.Events, 'fox:search:started', ::this.resetCount);
      this.listenTo(Tumblr.Events, 'fox:search:postFound', ::this.add);
      this.listenTo(Tumblr.Events, 'fox:blogSearch:started', ::this.reset);
      this.listenTo(Tumblr.Events, 'fox:blogSearch:update', ::this.update);
      this.listenTo(Tumblr.Events, 'peeprsearch:change:term', ::this.flushMatches);
      this.listenTo(this.matches, 'add', ::this.renderInitialMatches);
    },
    add(post) {
      const postData = Utils.PostFormatter.marshalPostAttributes(post);
      this.matches.add(postData);
    },
    flushMatches() {
      this.matches.reset();
    },
    resetCount() {
      this.set('count', 0);
      this.flushMatches();
    },
    update(posts) {
      posts.map(post => {
        // console.log(this.matches.get(post.id));
        if (!this.matches.get(post.id)) {
          this.add(post);
        }
      });
    },
    reset(posts) {
      posts.map(post => {
        this.add(post);
      });
    },
    // show the first 12 immediately
    // hide everyone after that and reveal on scroll
    renderInitialMatches(model) {
      if (this.state.get('dashboard')) {
        let count = this.get('count');
        this.set('count', count += 1);
        if (this.get('count') <= this.get('limit')) {
          Utils.PostFormatter.renderPost(model.toJSON());
        }
      } else {
        Utils.PostFormatter.renderPost(model.toJSON());
      }
    },
    hasNext(slug) {
      const nextMatches = this.matches.toJSON().slice(slug.next_offset, slug.next_offset + slug.limit);
      if (nextMatches.length > 0) {
        return true;
      }
      return false;
    },
    getSearchResults(slug) {
      const deferred = $.Deferred();
      const matches = this.matches.toJSON().slice(slug.next_offset, slug.next_offset + slug.limit);
      deferred.resolve(matches);
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('SearchModel', Search);
});
