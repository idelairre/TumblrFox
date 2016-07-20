import $ from 'jquery';
import Backbone from 'backbone';
import View from '../view/view';
import progressBar from './progressBar.html';
import ProgressBar from 'progressbar.js';

const Progress = View.extend({
  template: $(progressBar).html(),
  id: 'container',
  className: 'progress',
  tagName: 'div',
  render() {
    this.$el.html(this.template);
    this.bindEvents();
    this.$el.hide();
    return this;
  },
  afterRender() {
    setTimeout(() => {
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
    });
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'ASSEMBLE_FILE', ::this.$el.show);
    this.listenTo(Backbone.Events, 'DOWNLOAD_CACHE', ::this.$el.show);
    this.listenTo(Backbone.Events, 'CACHE_LIKES', ::this.$el.show);
    this.listenTo(Backbone.Events, 'CACHE_FOLLOWING', ::this.$el.show);
    this.listenTo(Backbone.Events, 'CACHE_POSTS', ::this.$el.show);
    this.listenTo(Backbone.Events, 'DONE', ::this.$el.hide);
    this.listenTo(Backbone.Events, 'PROGRESS', ::this.animateProgress);
    this.listenTo(Backbone.Events, 'RESTORE_CACHE', ::this.$el.show);
    this.listenTo(Backbone.Events, 'RESET_CACHE', ::this.$el.show);
    this.listenTo(Backbone.Events, 'REHASH_TAGS', ::this.$el.show);
    this.listenTo(Backbone.Events, 'RESTORING_CACHE', ::this.animateProgress);
    this.listenTo(Backbone.Events, 'CACHE_CONVERTED', ::this.$el.hide);
  },
  animateProgress(response) {
    const { constants, percentComplete } = response.payload;
    this.$bar.animate(percentComplete * 0.01);
    Backbone.Events.trigger('CHANGE_PROPS', constants);
    if (parseInt(percentComplete) === 100) {
      console.log('[DONE]');
      return;
    }
  },
  resetBar() {
    this.$bar.set(0);
  }
});

export default Progress;
