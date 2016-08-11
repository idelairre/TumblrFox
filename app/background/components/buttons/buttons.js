import $ from 'jquery';
import { snakeCase, template, toUpper } from 'lodash';
import Backbone from 'backbone';
import parseFile from './parseFile';
import View from '../view/view';
import buttonsTemplate from './buttons.html';

const Buttons = View.extend({
  defaults: {
    props: {
      saveViaFirebase: false
    }
  },
  template: template(buttonsTemplate),
  className: 'buttons',
  tagName: 'section',
  events: {
    'click button': 'toggleButton',
    'change #resetCache': 'resetCache'
  },
  initialize() {
    this.parseFile = parseFile;
    this.bindEvents();
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', ::this.renderProps);
    this.listenTo(Backbone.Events, 'CACHE_LIKES', this.$('#resetCache').prop('disabled', true));
    this.listenTo(Backbone.Events, 'DONE', this.$('#resetCache').prop('disabled', false));
    this.listenTo(Backbone.Events, 'CACHE_UPLOADED', ::this.createDownload);
    this.listenTo(Backbone.Events, 'CACHE_CONVERTED', ::this.createFileBlob);
    this.listenTo(this.props, 'change:canFetchApiLikes', ::this.setCacheLikesButton);
    this.listenTo(this.props, 'change:clientCaching', ::this.setCacheLikesButton);
  },
  render() {
    this.$el.html(this.template({
      env: __ENV__,
      props: this.props.attributes
    }));
    return this;
  },
  resetCache(e) {
    const val = $(e.currentTarget).val();
    Backbone.Events.trigger('RESET_CACHE', {
      type: 'resetCache',
      payload: val
    });
    e.currentTarget.selectedIndex = -1;
  },
  renderProps() {
    // this.render();
    this.setCacheLikesButton();
  },
  setCacheLikesButton() {
    this.$('button#cacheLikes').prop('disabled', !this.props.get('canFetchApiLikes') && !this.props.get('clientCaching'));
  },
  toggleButton(e) {
    const key = this.$(e.currentTarget).prop('id');
    if (key === 'restoreCache') {
      this.restoreCache();
    } else { // all other events are sent to settings component and posted to the background script
      const eventName = toUpper(snakeCase(key));
      Backbone.Events.trigger(eventName, {
       type: key
     });
    }
  },
  restoreCache() {
    if (this.props.get('saveViaFirebase')) {
      Backbone.Events.trigger('RESTORE_CACHE', {
        type: 'restoreCache'
      });
    } else {
      document.getElementById('file').click();
      document.getElementById('file').addEventListener('change', e => {
        Backbone.Events.trigger('ASSEMBLE_FILE', {
          fileSize: file.size
        });
        this.parseFile(e.target.files[0], response => {
          Backbone.Events.trigger('RESTORE_CACHE', {
            type: 'restoreCache',
            payload: response
          });
        });
      }, false);
    }
  },
  createDownload(response) {
    chrome.downloads.download({
      url: response.payload.url,
      filename: 'tumblrfox-data.json'
    });
  },
  createFileBlob(response) {
    chrome.downloads.download({
      url: response.payload.file,
      filename: 'tumblrfox-data.csv'
    });
  }
});

export default Buttons;
