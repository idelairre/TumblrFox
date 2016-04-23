module.exports = (function loader() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;

  let Loader = {
    options: {
      loading: false,
      error: false
    },
    start() {
      Tumblr.Events.on('indashblog:search:fetch-requested', this.show),
      Tumblr.Events.on('indashblog:search:complete', this.hide),
      Tumblr.Events.on('indashblog:search:post-added', this.hide),
      Tumblr.Events.on('peepr-open-request', this.stop),
      Tumblr.Events.on('fox:postFetch:started', this.show),
      Tumblr.Events.on('fox:postFetch:finished', this.hide),
      Tumblr.Events.on('fox:postFetch:error', this.hide),
      window.addEventListener('chrome:fetch:posts', this.show),
      window.addEventListener('chrome:response:posts', this.hide);
    },
    stop() {
      Tumblr.Events.off('indashblog:search:fetch-requested', this.show),
      Tumblr.Events.off('indashblog:search:complete', this.hide),
      Tumblr.Events.off('indashblog:search:post-added', this.hide),
      Tumblr.Events.off('fox:postFetch:started', this.show),
      Tumblr.Events.off('fox:postFetch:finished', this.hide),
      Tumblr.Events.off('fox:postFetch:error', this.hide),
      window.removeEventListener('chrome:fetch:posts', this.show),
      window.removeEventListener('chrome:response:posts', this.hide),
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

  Tumblr.Fox.Loader = Loader;

  return Tumblr.Fox;
})
