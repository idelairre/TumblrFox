module.exports = (function loader() {
  const $ = Backbone.$;
  Tumblr.Fox = Tumblr.Fox || {};

  Tumblr.Fox.Loader = {
    options: {
      loading: false,
      error: false
    },
    start() {
      Tumblr.Events.on('indashblog:search:fetch-requested', this.show);
      Tumblr.Events.on('indashblog:search:complete', this.hide);
      Tumblr.Events.on('indashblog:search:post-added', this.hide);
      Tumblr.Events.on('peepr-open-request', this.stop);
      Backbone.Events.on('fox:postFetch:started', this.show);
      Backbone.Events.on('fox:postFetch:finished', this.hide);
      Backbone.Events.on('fox:postFetch:error', this.hide);
      window.addEventListener('fetch:posts', this.show);
      window.addEventListener('response:posts', this.hide);
    },
    stop() {
      Tumblr.Events.off('indashblog:search:fetch-requested', this.show);
      Tumblr.Events.off('indashblog:search:complete', this.hide);
      Tumblr.Events.off('indashblog:search:post-added', this.hide);
      Backbone.Events.off('fox:postFetch:started', this.show);
      Backbone.Events.off('fox:postFetch:finished', this.hide);
      Backbone.Events.off('fox:postFetch:error', this.hide);
      window.removeEventListener('fetch:posts', this.show);
      window.removeEventListener('response:posts', this.hide);
      Tumblr.Events.on('peepr:close', this.start);
    },
    show() {
      Tumblr.Fox.Loader.options.loading = true,
      $('#auto_pagination_loader_loading').show(),
      setTimeout(this.hide, 1000);
    },
    hide() {
      Tumblr.Fox.Loader.options.loading = false,
      $('#auto_pagination_loader_loading').hide();
    }
  }
  return Tumblr.Fox;
})
