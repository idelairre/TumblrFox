module.exports = (function textSearchAutocompleteModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { countBy, identity, invoke, omit } = _;
  const { chromeMixin } = Tumblr.Fox;

  Object.defineProperty(Object.prototype, 'renameProperty', {
    writable: false,
    enumerable: false,
    configurable: false,
    value(oldName, newName) {
      if (oldName === newName) {
        return this;
      }
      if (this.hasOwnProperty(oldName)) {
        this[newName] = this[oldName];
        delete this[oldName];
      }
      return this;
    }
  });

  const TextSearchAutocompleteModel = Backbone.Model.extend({
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
      this.listenTo(Tumblr.Events, 'fox:setSearchOption', ::this.setState);
    },
    bindEvents() {
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
          this.bindEvents();
          break;
        case 'tag':
          this.unbindEvents();
          break;
      }
    },
    fetch(e) {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:keys', ::this.parse);
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
      let keys = e.detail || e;

      keys.map(key => {
        key.renameProperty('term', 'tag');
      });

      if (!this.fetched) {
        this.items.reset(keys);
      }
      if (this.get('matchTerm') === '') {
         this.set('typeAheadMatches', this.items.toJSON());
       }
      omit(e, 'terms');
      console.log('[TERMS]', this.items);
    }
  });

  Tumblr.Fox.TextSearchAutocompleteModel = new TextSearchAutocompleteModel();
});
