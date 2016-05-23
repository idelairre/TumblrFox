import $ from 'jquery';
import Backbone from 'backbone';
import progressBar from './progressBar.html';
import ProgressBar from 'progressbar.js';

const Progress = Backbone.View.extend({
  template: $(progressBar).html(),
  id: 'container',
  className: 'progress',
  tagName: 'div',
  initialize(e) {
    this.props = e;
  },
  render() {
    this.rendered = true;
    this.$el.html(this.template);
    // const progress = $('#container');
    Backbone.View.prototype.render.apply(this, arguments);
    this.afterRender();
    this.bindEvents();
    this.$el.hide();
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
    this.listenTo(Backbone.Events, 'ASSEMBLE_FILE', ::this.$el.show)
    this.listenTo(Backbone.Events, 'CACHE_LIKES', ::this.$el.show);
    this.listenTo(Backbone.Events, 'CACHE_FOLLOWING', ::this.$el.show);
    this.listenTo(Backbone.Events, 'HIDE_PROGRESS', ::this.$el.hide);
    this.listenTo(Backbone.Events, 'SHOW_ERROR', ::this.showError);
    this.listenTo(Backbone.Events, 'ANIMATE_PROGRESS', ::this.animateProgress);
    this.listenTo(Backbone.Events, 'RESTORING_CACHE', ::this.animateProgress);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', this.setProps);
  },
  setProps(newProps) {
    this.props.set(newProps);
  },
  animateProgress(response) {
    const { constants, percentComplete } = response.payload;
    this.$bar.animate(percentComplete * 0.01);
    Backbone.Events.trigger('CHANGE_PROPS', constants);
  },
  resetBar() {
    this.$bar.set(0);
  },
  showError(e) {
    console.error(e);
    // error
  }
});

export default Progress;
