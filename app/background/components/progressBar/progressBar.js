import $ from 'jquery';
import { Events } from 'backbone';
import ProgressBar from 'progressbar.js';
import View from '../view/view';

const Progress = View.extend({
  template: '',
  id: 'container',
  className: 'progress',
  tagName: 'div',
  initialize() {
    this.bindEvents();
  },
  render() {
    this.$el.html(this.template);
  },
  afterRender() {
    this.$bar = new ProgressBar.Line(this.$el[0], {
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
    this.listenTo(Events, 'ASSEMBLE_FILE', ::this.show);
    this.listenTo(Events, 'DOWNLOAD_CACHE', ::this.show);
    this.listenTo(Events, 'CACHE_LIKES', ::this.show);
    this.listenTo(Events, 'CACHE_FOLLOWING', ::this.show);
    this.listenTo(Events, 'CACHE_POSTS', ::this.show);
    this.listenTo(Events, 'DELETING', ::this.fakeAnimateProgress);
    this.listenTo(Events, 'DONE', ::this.hide);
    this.listenTo(Events, 'PROGRESS', ::this.update);
    this.listenTo(Events, 'RESTORE_CACHE', ::this.show);
    this.listenTo(Events, 'RESET_CACHE', ::this.show);
    this.listenTo(Events, 'REHASH_TAGS', ::this.show);
    this.listenTo(Events, 'RESTORING_CACHE', ::this.update);
    this.listenTo(Events, 'CACHE_CONVERTED', ::this.hide);
  },
  update(response) {
    if (typeof response.payload !== 'undefined') {
      const { constants, percentComplete } = response.payload;
      Events.trigger('CHANGE_PROPS', constants); // TODO: add a 'changeAttributes' method to Constant so this doesn't send a shit ton of 'CHANGE_PROPS' events
      this.animateProgress(percentComplete);
    }
  },
  animateProgress(percentComplete) {
    if (percentComplete >= 100) {
      this.$bar.animate(1);
    } else {
      this.$bar.animate(percentComplete * 0.01);
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
