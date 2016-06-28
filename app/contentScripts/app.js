module.exports = (function init(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { extend, camelCase, last, omit } = _;
  const listItems = $('#posts').find('li');
  const attachNode = $(listItems[listItems.length - 1]);
  const formKey = $('#tumblr_form_key').attr('content');
  const icon = 'iVBORw0KGgoAAAANSUhEUgAAAGcAAABpCAYAAAAnSz2JAAACkklEQVR42u3c0U3DMBDGcW/BGKzBGIzBGozRNToGY6C+RElkGtEHqIJoEvv8ne9/z0jE3+/OTZM0KVG+Kt+KJGwz34Qzz/OJ2MSGIf8oorOB2YUDUL267kznwzgA1Z+aQzgA1YU5jANQPZgiONd98p14y8MUwWF66sAUwwFo15nZhxkOQGWnpjgOQMm+2fPGIn7DRt+KwzU4wybPOwoKowzzzoLEIL98oKARxokOVD23XKCAEcaJdgZn1tC5UAEjjBMByDyrXLjAEcb56x9nRyXTxFYL9Ixj1QBmOGtncMCI4Hjc3lpnYx6WFyCFXJoEpQ50f2yXy+UpDM7awTxyn92i1p4watWwTTtYcXpUmrU5jtoZnFKjJoW9X+XzRzEHyWBad22Lzz9ZnJZAyg2aIu/5rc7MXOK0/lautG5JnGEYnltcaFRryqT6Td363onqmmUvo1jdq1der6trXDUePwJHoNOVzsy6wSkF5K0J3eCM4/hy5Dg9NqAbnCOfF57X5/q28X/H631t7h5ZevSY7/9mmqZX9zgegVbOzN56aLougbqGud3TOCkv6LpNffa6TacIC+sWxvsC1Y977btbCCCVx6yqTo1XoFAwnhYdEmapZZ/MlB6Mx9/VhIIBSBwGIAc4AAnDACQOA5A4DDjCMACJwwD0XfIvRWdqAr0TBhiA4sDc7qmcgWF6gAHody1v9Ug9FFMDEDDRgVKvpf68clgY79OTohQwAJW6mHlOEYupAQiYvWXx/kxgOpoeRESBkBAFKvabGYCYmjBApC4KRNqiOCQtCkTCwkCkKwpEqqJApCkKRIqiOCQoCkRyokDL61ZITRSItESBSEkUiHQa1/LGQmAcTQ+JiALJ/2iWoqiK9QXVEo0oBz0DhAAAAABJRU5ErkJggg==';

  window.$ = $;

  const TumblrFox = function () {
    this.constants = {
      attachNode,
      formKey,
      icon
    };
    this.options = new Model({
      firstRun: false,
      initialized: false,
      rendered: false,
      test: false,
      cachedTags: false,
      enableTextSearch: false
    });

    this.state = {};
    this.Application = {};
    this.Events = {}
    this.Utils = {};
    this.Source = {};
    this.Models = {};
    this.Listeners = {};
    this.Components = {};
    this.Mixins = {};

    extend(this.Events, Backbone.Events);

    this.initialize();
  };

  extend(TumblrFox.prototype, Backbone.Events);

  extend(TumblrFox.prototype, {
    initialize() {
      this.bindListeners();
    },
    bindListeners() {
      this.listenTo(this, 'fox:components:fetcherInitialized', ::this.bindComponentGet);
      this.listenTo(this, 'fox:components:add', ::this.emitDependency);
    },
    register(name, component) {
      if (name.includes('Model')) {
        this.Models[name] = component;
      } else if (name.includes('Component') || name.includes('Container')) {
        this.Components[name] = component;
      } else if (name.includes('Mixin')) {
        this.Mixins[name] = component;
      } else if (name.includes('Listener')) {
        this.Listeners[name] = new component();
      } else if (name.includes('Source')) {
        this.Source[name] = new component();
      }
      this.Utils.ComponentFetcher.put(name, component);
    },
    bindComponentGet(ComponentFetcher) {
      this.get = ComponentFetcher.get.bind(ComponentFetcher);
      this.put = ComponentFetcher.put.bind(ComponentFetcher);
    },
    emitDependency(name, dependency) {
      this.trigger(`initialize:dependency:${camelCase(name)}`, dependency);
    },
    fetchConstants() {
      this.chromeListenTo('bridge:initialized', () => {
        this.chromeTrigger('chrome:fetch:constants', response => {
          this.trigger('initialize:constants', response);
        });
      });
    },
    updateConstants(payload) {
      this.chromeTrigger('chrome:initialize:constants', payload);
    }
  });

  Tumblr.Fox = new TumblrFox();
});
