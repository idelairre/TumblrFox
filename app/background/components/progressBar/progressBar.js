import $ from 'jquery';
import Backbone, { View } from 'backbone';
import ProgressBar from 'progressbar.js';

const Progress = View.extend({
  template: '<div></div>',
  id: 'container',
  className: 'progress',
  tagName: 'div',
  initialize() {
    this.bindEvents();
  },
  render() {
    this.$el.html(this.template);
    setTimeout(() => {
      this.afterRender()
    }, 0);
  },
  afterRender() {
    this.$bar = new ProgressBar.Line(container, {
      strokeWidth: 4,
      easing: 'easeInOut',
      duration: 100,
      color: '#FFEA82',
      trailColor: '#eee',
      trailWidth: 1,
      svgStyle: {
        width: '100%',
        height: '100%'
      },
      text: {
        style: {
          color: '#999',
          position: 'absolute',
          right: '0',
          top: '30px',
          padding: 0,
          margin: 0,
          transform: null
        },
        autoStyleContainer: false
      },
      from: {
        color: '#FFEA82'
      },
      to: {
        color: '#ED6A5A'
      },
      step: (state, bar) => {
        bar.setText(`${Math.round(bar.value() * 100)}%`);
      }
    });
    this.$el.hide();
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'ASSEMBLE_FILE', ::this.show);
    this.listenTo(Backbone.Events, 'DOWNLOAD_CACHE', ::this.show);
    this.listenTo(Backbone.Events, 'CACHE_LIKES', ::this.show);
    this.listenTo(Backbone.Events, 'CACHE_FOLLOWING', ::this.show);
    this.listenTo(Backbone.Events, 'CACHE_POSTS', ::this.show);
    this.listenTo(Backbone.Events, 'DELETING', ::this.fakeAnimateProgress);
    this.listenTo(Backbone.Events, 'DONE', ::this.hide);
    this.listenTo(Backbone.Events, 'PROGRESS', ::this.animateProgress);
    this.listenTo(Backbone.Events, 'RESTORE_CACHE', ::this.show);
    this.listenTo(Backbone.Events, 'RESET_CACHE', ::this.show);
    this.listenTo(Backbone.Events, 'REHASH_TAGS', ::this.show);
    this.listenTo(Backbone.Events, 'RESTORING_CACHE', ::this.animateProgress);
    this.listenTo(Backbone.Events, 'CACHE_CONVERTED', ::this.hide);
  },
  animateProgress(response) {
    if (typeof response.payload !== 'undefined') {
      const { constants, percentComplete } = response.payload;
      this.$bar.animate(percentComplete * 0.01);
      Backbone.Events.trigger('CHANGE_PROPS', constants);
      if (parseInt(percentComplete) === 100) {
        console.log('[DONE]');
        return;
      }
    } else {
      if (response.type && response.type === 'done') {
        this.$bar.animate(1);
      }
    }
  },
  fakeAnimateProgress() {
    let counter = 0;
    const interval = setInterval(() => {
      counter += 1;
      this.$bar.animate(counter * 0.01);
      if (counter === 100) {
        clearTimeout(interval);
      }
    }, 100);
  },
  resetBar() {
    this.$bar.set(0);
  },
  show() {
    this.$el.show();
    this.resetBar();
  },
  hide() {
    this.$el.hide();
    this.resetBar();
  }
});

export default Progress;
