module.exports = (function (Tumblr, Backbone, _, BlogSearch, ChromeMixin) {
  const { $, Collection } = Backbone;
  const { assign, omit, pick } = _;
  const { Utils } = Tumblr.Fox;

  const Search = BlogSearch.extend({
    mixins: [ChromeMixin],
    initialize(options) {
      assign(this, pick(options, 'state'));
      this.matches = new Collection();
      this.set(this.defaults);
      this.set('count', 0);
      this.set('renderedResults', false);
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(this, 'change:unsetTerm', ::this.onUnsetTermChange);
      this.listenTo(this, 'change:term change:sort change:post_type change:post_role change:filter_nsfw', ::this.resetSearch); // NOTE: have to excluse count here or bad shit will happen
      this.listenTo(this.matches, 'add', ::this.renderInitialMatches);
      this.listenTo(Tumblr.Fox.Events, 'fox:search:changeTerm', ::this.onTermSelect);
      this.listenTo(Tumblr.Fox.Events, 'fox:search:postFound', ::this.add);
      this.listenTo(Tumblr.Fox.Events, 'fox:blogSearch:update', ::this.update);
    },
    unbindEvents() {
      this.stopListening();
    },
    toJSON() {
      return omit(this.attributes, ['count', 'renderedResults', 'showNsfwSwitch', 'showOriginalPostsSwitch', 'state']);
    },
    resetSearch() {
      this.set(pick(this.defaults, ['limit', 'next_offset']));
      this.trigger('search:reset');
      this.flushMatches();
    },
    reset() {
      this.set(this.defaults);
      this.trigger('reset');
    },
    onTermSelect(query) {
      if (typeof query.term === 'undefined') {
        query.term = this.get('unsetTerm');
      }
      if (query.term.length) {
        this.set('term', query.term);
      }
      this.flushMatches();
    },
    onUnsetTermChange() {
      if (this.get('unsetTerm') === this.previous('unsetTerm')) {
        return;
      }
      Tumblr.Fox.Events.trigger('fox:search:unsetTerm', {
        term: this.get('unsetTerm'),
        loggingData: this.toJSON()
      });
    },
    add(post) {
      const postData = Utils.PostFormatter.marshalPostAttributes(post);
      this.matches.add(postData);
    },
    flushMatches() {
      this.set('count', 0);
      this.matches.reset();
    },
    update(posts) {
      posts.forEach(post => {
        if (!this.matches.get(post.id)) {
          this.add(post);
        }
      });
    },
    resetPosts(posts) {
      posts.forEach(post => {
        this.add(post);
      });
    },
    renderInitialMatches(model) {
      // show the first 10 immediately
      // hide everyone after that and reveal on scroll
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
    getSearchResults(slug) {
      const deferred = $.Deferred();
      const matches = this.matches.toJSON().slice(slug.next_offset, slug.next_offset + slug.limit);
      deferred.resolve(matches);
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('SearchModel', Search);

});
