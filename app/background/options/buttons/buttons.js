import $ from 'jquery';
import { snakeCase, toUpper } from 'lodash';
import Backbone from 'backbone';
import View from '../view/view';
import buttonsTemplate from './buttons.html';

const parseFile = (file, callback) => {
  const fileSize = file.size;
  let chunkSize = (64 * 1024); // bytes
  let offset = 0;
  let chunkReaderBlock = null;

  const readEventHandler = e => {
    if (e.target.error) {
      return;
    }
    offset += chunkSize;
    Backbone.Events.trigger('CREATING_FILE_BLOB', {
      offset,
      fileSize
    });
    callback({
      fileFragment: e.target.result,
      fileSize,
      offset
    });
    if (chunkSize === 0) {
      Backbone.Events.trigger('DONE_CREATING_BLOB');
      return;
    }
    if (offset + chunkSize > fileSize) {
      chunkSize = fileSize - offset;
    }
    if (chunkSize <= 0) { // allows one more pass so that backend can detect when the stream is done
      chunkSize = 0;
    }
    // callback for handling read chunk
    // off to the next chunk
    chunkReaderBlock(offset, chunkSize, file);
  }

  chunkReaderBlock = (_offset, length, _file) => {
    const r = new FileReader();
    const blob = _file.slice(_offset, length + _offset);
    r.onload = readEventHandler;
    r.readAsText(blob);
  };
  // now let's start the read with the first block
  chunkReaderBlock(offset, chunkSize, file);
}

const Buttons = View.extend({
  defaults: {
    props: {
      saveViaFirebase: false
    }
  },
  template: $(buttonsTemplate).html(),
  className: 'buttons',
  tagName: 'section',
  render() {
    this.parseFile = parseFile;
    this.$download = $('#cache');
    this.$el.html(this.template);
    this.bindEvents();
    return this;
  },
  events: {
    'click button': 'toggleButton'
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', this.renderProps);
    this.listenTo(Backbone.Events, 'CACHE_UPLOADED', ::this.createDownload);
    this.listenTo(Backbone.Events, 'CACHE_CONVERTED', ::this.createFileBlob);
    this.listenTo(this.props, 'change:cachedPostsCount', this.toggleButtonsDisabled);
    this.listenTo(this.props, 'change:canFetchApiLikes', this.setCacheLikesButton);
    this.listenTo(this.props, 'change:clientCaching', this.setCacheLikesButton);
  },
  renderProps() {
    this.toggleButtonsState();
  },
  toggleButtonsState() {
    this.setCacheLikesButton();
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
      Backbone.Events.trigger(e, { type: key });
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
    this.$download.prop('href', response.payload.url);
    this.$download.prop('download', 'tumblrData.json');
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
