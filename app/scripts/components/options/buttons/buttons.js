import $ from 'jquery';
import { snakeCase, toUpper } from 'lodash';
import Backbone from 'backbone';
import buttonsTemplate from './buttons.html';

const Buttons = Backbone.View.extend({
  template: $(buttonsTemplate).html(),
  className: 'buttons',
  tagName: 'section',
  initialize(e) {
    this.props = e;
  },
  render() {
    this.initialized = true;
    this.rendered = true;
    this.$download = $('#cache');
    console.log(this.$download);
    this.$el.html(this.template);
    Backbone.View.prototype.render.apply(this, arguments);
    this.bindEvents();
  },
  events: {
    'click button': 'toggleButton'
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', this.renderProps);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', this.setProps);
    this.listenTo(Backbone.Events, 'CACHE_UPLOADED', ::this.createDownload);
    this.listenTo(Backbone.Events, 'CACHE_CONVERTED', ::this.createFileBlob);
    this.listenTo(this.props, 'change:cachedPostsCount', this.toggleButtonsDisabled);
    this.listenTo(this.props, 'change:canFetchApiLikes', this.setCacheLikesButton);
    this.listenTo(this.props, 'change:clientCaching', this.setCacheLikesButton);
  },
  setProps(newProps) {
    this.props.set(newProps);
  },
  renderProps() {
    this.toggleButtonsState();
  },
  toggleButtonsState() {
    this.toggleButtonsDisabled();
    this.setCacheLikesButton();
  },
  toggleButtonsDisabled() {
    if (this.props.get('cachedPostsCount') === 0) {
      this.$('button#cacheTags').prop('disabled', true);
    } else {
      this.$('button#cacheTags').prop('disabled', false);
    }
  },
  setCacheLikesButton() {
    this.$('button#cacheLikes').prop('disabled', !this.props.get('canFetchApiLikes') && !this.props.get('clientCaching'));
  },
  toggleButton(e) {
    const key = this.$(e.currentTarget).prop('id');
    console.log('[KEY]', key);
    if (key === 'restoreCache') {
      this.restoreCache();
    } else { // all other events are sent to settings component and posted to the background script
      const e = toUpper(snakeCase(key));
      Backbone.Events.trigger(e, { action: key });
    }
  },
  restoreCache() {
    document.getElementById('file').click();
    document.getElementById('file').addEventListener('change', e => {
      const rawFile = e.target.files[0];
      Backbone.Events.trigger('ASSEMBLE_FILE', { fileSize: file.size });
      const fileSize = file.size;
      const r = new FileReader();
      r.onload = e => {
        const file = e.target.result;
        Backbone.Events.trigger('RESTORE_CACHE', { action: 'restoreCache', payload: { fileSize, file }});
      }
      r.readAsText(rawFile)
    }, false);
  },
  parseFile(file, callback) {
    const fileSize = file.size;
    const chunkSize = 64 * 1024; // bytes
    let offset = 0;
    let chunkReaderBlock = null;

    const readEventHandler = e => {
      if (e.target.error === null) {
        offset += e.target.result.length;
        callback(e.target.result); // callback for handling read chunk
      } else {
        console.log(`Read error: ${e.target.error}`);
        return;
      }
      if (offset >= fileSize) {
        console.log('Done reading file');
        return;
      }
      // off to the next chunk
      chunkReaderBlock(offset, chunkSize, file);
    };

    chunkReaderBlock = (_offset, length, _file) => {
      const r = new FileReader();
      const blob = _file.slice(_offset, length + _offset);
      r.onload = readEventHandler;
      r.readAsText(blob);
    };
    // now let's start the read with the first block
    chunkReaderBlock(offset, chunkSize, file);
  },
  createDownload(response) {
    this.$download.prop('href', response.payload.url);
    setTimeout(() => {
      document.getElementById('cache').click();
    }, 1);
  },
  createFileBlob(response) {
    console.log('[CREATING FILE BLOB]');
    Backbone.Events.trigger('CREATE_FILE_BLOB', this.$download, response);
    this.$download.prop('href', response.payload.file);
    this.$download.prop('download', `tumblrData.${response.payload.type}`);
    setTimeout(() => {
      document.getElementById('cache').click();
    }, 1);
  },
});

export default Buttons;
