module.exports = (function loader() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;

  // TODO: turn this into a backbone view so it can listen to post model changes rather than have a huge number of listeners

  let Loader = {
    options: {
      loading: false,
      error: false
    },
    start() {
      // show
      Tumblr.Events.on('fox:searchLikes:started', this.show);
      Tumblr.Events.on('indashblog:search:fetch-requested', this.show);
      window.addEventListener('chrome:fetch:posts', this.show);
      window.addEventListener('chrome:fetch:likes', this.show);
      Tumblr.Events.on('fox:postFetch:started', this.show);
      // hide
      Tumblr.Events.on('fox:postFetch:finished', this.hide);
      Tumblr.Events.on('indashblog:search:complete', this.hide);
      Tumblr.Events.on('indashblog:search:post-added', this.hide);
      Tumblr.Events.on('fox:postFetch:failed', this.hide);
      Tumblr.Events.on('fox:searchLikes:finished', this.hide);
      window.addEventListener('chrome:response:posts', this.hide);
      window.addEventListener('chrome:response:likes', this.hide);
      // stop
      Tumblr.Events.on('peepr-open-request', this.stop);
    },
    stop() {
      Tumblr.Events.off('indashblog:search:fetch-requested', this.show);
      Tumblr.Events.off('indashblog:search:complete', this.hide);
      Tumblr.Events.off('indashblog:search:post-added', this.hide);
      Tumblr.Events.off('fox:postFetch:started', this.show);
      Tumblr.Events.off('fox:postFetch:finished', this.hide);
      Tumblr.Events.off('fox:postFetch:failed', this.hide);
      Tumblr.Events.off('fox:searchLikes:started', this.show);
      Tumblr.Events.off('fox:searchLikes:finished', this.hide);
      window.removeEventListener('chrome:fetch:posts', this.show);
      window.removeEventListener('chrome:fetch:likes', this.show);
      window.removeEventListener('chrome:response:posts', this.hide);
      window.removeEventListener('chrome:response:likes', this.hide);
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

  return Tumblr.Fox.Loader;
})
