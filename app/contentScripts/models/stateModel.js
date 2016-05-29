module.exports = (function(Tumblr, Backbone, _) {
  const { assign } = _;
  
  const State = Backbone.Model.extend({
    initialize(e) {
      assign(this, e);
    },
    getState() {
      for (const key in this.attributes) {
        if (this.attributes[key]) {
          return key;
        }
      }
    }
  });

  Tumblr.Fox.state = new State({
    dashboard: !1,
    user: !0,
    likes: !1
  });

  Tumblr.Fox.searchOptions = new State({
    tag: !0,
    text: !1
  });

  Tumblr.Fox.State = State;
})
