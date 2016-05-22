import ProgressBar from 'progressbar.js';
import Backbone from 'backbone';
import { camelCase, isError } from 'lodash';
import Tipped from './lib/tipped';
import $ from 'jquery';
import '../styles/tipped.less';

const clientCachingTooltip = {
  template: `
  <div class="note tooltip" style="position: absolute" data-tooltip="clientCaching">
    * WARNING: this will reset your cache! Toggles caching via Tumblr's frontend.<br>
    <li>Advantages: faster post rendering, actual Tumblr html instead of reconstituted html via jquery, native/predictable Tumblr behavior, you don't have to reveal your likes to other users</li>
    <li>Drawbacks: significantly slower cache time than fetching from the API, timestamps are less accurate</li>
  </div>`
};

const saveViaFirebase = {
  template: `
  <div class="note tooltip" style="position: absolute" data-tooltip="saveViaBFirebase">
    * Enabling will cause clicking "Save cache" to upload your cached data to Firebase temporarily before downloading it in your browser. Otherwise it will assemble the file in your browser.<br>
    <li>Advantages: Much more stable than assembling in the browser</li>
    <li>Drawbacks: Slow/sometimes unavailable due to data limits</li>
  </div>`
};

const cachingTooltip = {
  template: `<i class="note tooltip" style="position: absolute" data-tooltip="caching">* some posts and blogs you are following may have been deleted, it is sometimes not possible to fetch 100% of your likes or followed blogs.</i>`
};

const progress = $('#container');
const bar = new ProgressBar.Line(container, {
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

function parseFile(file, callback) {
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
  }

  chunkReaderBlock = (_offset, length, _file) => {
    let r = new FileReader();
    console.log(_file);
    let blob = _file.slice(_offset, length + _offset);
    r.onload = readEventHandler;
    r.readAsText(blob);
  }

  // now let's start the read with the first block
  chunkReaderBlock(offset, chunkSize, file);
}

const Options = Backbone.View.extend({
  defaults: {
    props: {
      cachedPostsCount: 0,
      cachedFollowingCount: 0,
      cachedTagsCount: 0
    }
  },
  initialize() {
    this.initialized = !1;
    this.$debug = this.$('#debugConsole');
    this.$download = $('a#cache');
    this.$status = this.$('#status');
    this.props = new Backbone.Model();
    this.$bar = bar;
    this.$progress = progress;
    Tipped.create('[data-tooltip-key="clientCaching"]', $(clientCachingTooltip.template).html(), {
      skin: 'light', position: 'topleft'
    });
    Tipped.create('[data-tooltip-key="caching"]', $(cachingTooltip.template).html(), {
      skin: 'light', position: 'topleft'
    });
    Tipped.create('[data-tooltip-key="saveViaFirebase"]', $(saveViaFirebase.template).html(), {
      skin: 'light', position: 'topleft'
    });
    this.bindEvents();
    this.initializePort();
    // console.log('[tooltips]', Tipped);
  },
  initializePort() {
    this.port = chrome.runtime.connect({
      name: 'options'
    });
    this.port.onMessage.addListener(response => {
      if (response.message === 'processDone') {
        this.$progress.hide();
      }
      if (response.message === 'initialized') {
        this.restoreOptions(response.payload);
        this.afterInitialize();
      }
      if (response.message === 'canFetchApiLikesStatus') {
        this.props.set('canFetchApiLikes', response.payload);
      }
      if (response.message === 'cache') {
        this.$debug.text('Done');
        if (this.props.get('saveViaFirebase')) {
          this.$download.prop('href', response.url);
        } else {
          const url = URL.createObjectURL(new Blob([response.payload], {
            type: 'application/csv,charset=utf-8'
          }));
          this.$download.prop('href', url);
        }
        this.$download.prop('download','tumblrData.csv');
        setTimeout(() => {
          document.getElementById('cache').click();
          this.$debug.text('');
        }, 1);
      }
    });
  },
  afterInitialize() {
    this.port.onMessage.addListener(::this.animateProgress);
    this.$('buttons').prop('disabled', false);
  },
  events: {
    'click button': 'toggleButton',
    'click [type=checkbox]': 'toggleCheck'
  },
  bindEvents() {
    this.listenTo(this.props, 'change', ::this.setProps);
    this.listenTo(this.props, 'change:status', ::this.setStatus);
    this.listenTo(this.props, 'change:defaultKeys', model => {
      if (model.get('defaultKeys')) {
        this.$('.consumer-secret').hide();
        this.$('.consumer-key').hide();
      } else {
        this.$('.consumer-secret').show();
        this.$('.consumer-key').show();
      }
    });
    this.listenTo(this.props, 'change:setUser', model => {
      if (model.get('setUser')) {
        this.$('.user').show();
      } else {
        this.$('.user').hide();
      }
    });
    this.listenTo(this.props, 'change:clientCaching', model => {
      if (this.initialized) {
        this.port.postMessage({
          type: 'checkLikes',
          payload: this.props.get('userName')
        });
      }
    })
    this.listenTo(this.props, 'change:debug', model => {
      if (model.get('debug')) {
        this.$('section.debug').show();
      } else {
        this.$('section.debug').hide();
      }
    });
    this.listenTo(this.props, 'change:cachedPostsCount', model => {
      if (model.get('cachedPostsCount') === 0) {
        this.$('button#cacheTags').prop('disabled', true);
      } else {
        this.$('button#cacheTags').prop('disabled', false);
      }
    });
    this.listenTo(this.props, 'change:clientCaching', ::this.setCacheLikesButton);
    this.listenTo(this.props, 'change:canFetchApiLikes', ::this.setCacheLikesButton);
  },
  setCacheLikesButton() {
    this.$('button#cacheLikes').prop('disabled', !this.props.get('canFetchApiLikes') && !this.props.get('clientCaching'));
  },
  setProps(model) {
    console.log('[PROPS]', model.changed);
    for (const key in model.changed) {
      if ({}.hasOwnProperty.call(model.changed, key)) {
        const keyElem = this.$(`#${key}`);
        const tag = keyElem.prop('tagName');
        if (tag === 'INPUT' && keyElem.attr('type') === 'text') {
          keyElem.val(this.props.get(key));
        } else if (tag === 'INPUT' && keyElem.attr('type') === 'checkbox') {
          keyElem.attr('checked', this.props.get(key));
        } else if (tag === 'SPAN') {
          keyElem.text(this.props.get(key));
        }
      }
    }
    this.port.postMessage({
      type: 'updateSettings',
      payload: this.props.attributes
    });
    this.setAuthDivState();
  },
  setAuthDivState() {
    if (!this.props.get('setUser') && this.props.get('defaultKeys')) {
      this.$('.authentication').hide();
    }
    if (!this.props.get('defaultKeys') || this.props.get('setUser')) {
      this.$('.authentication').show();
    }
  },
  setStatus(props) {
    this.$status.text(props.get('status'));
  },
  toggleButton(e) {
    const key = this.$(e.currentTarget).prop('id');
    this.resetBar();
    this.$progress.show();
    this.$status.text('');
    if (key === 'restoreCache') {
      this.restoreCache();
    } else {
      this.port.postMessage({
        type: key
      });
    }
  },
  toggleCheck(e) {
    const check = e.target.checked;
    const key = this.$(e.currentTarget).prop('id');
    this.props.set(key, check);
  },
  animateProgress(response) {
    if (response.hasOwnProperty('error')) {
      console.error(response.error);
      this.$debug.text(`Error: ${JSON.stringify(response.error)}`);
      return;
    } else if (response.hasOwnProperty('percentComplete')) {
      let { constants, database, percentComplete, itemsLeft, total } = response;
      const totalKey = camelCase(`total-${database}-count`);
      const cachedKey = camelCase(`cached-${database}-count`);
      this.$(`span#${totalKey}`).text(total);
      this.$debug.text(`Response: ${JSON.stringify(response)}`);
      this.$bar.animate(percentComplete * 0.01);
      this.props.set(constants);
    }
  },
  saveOptions() {
    console.log(this.props);
    const consumerKey = this.$('#consumerKey').val();
    const consumerSecret = this.$('#consumerSecret').val();
    const userName = this.$('#userName').val();
    const syncSlug = {
      consumerKey: consumerKey !== '' ? consumerKey : this.props.get('consumerKey'),
      consumerSecret: consumerSecret !== '' ? consumerSecret : this.props.get('consumerSecret'),
      userName: userName !== '' ? userName : this.props.get('userName')
    };
    chrome.storage.sync.set(syncSlug, () => {
      this.$status.text('Options saved.');
      setTimeout(() => {
        this.$status.text('');
      }, 750);
    });
    this.port.postMessage({
      type: 'updateSettings',
      payload: this.props.attributes
    });
  },
  restoreOptions(constants) {
    this.$debug.text(`Constants: ${JSON.stringify(constants)}`);
    setTimeout(() => {
      this.props.set(constants);
      this.initialized = !0;
    }, 1);
  },
  cacheLikes() {
    this.resetBar();
    this.port.postMessage({
      type: 'cacheLikes',
      clientCaching: this.props.get('clientCaching')
    });
  },
  restoreCache(e) {
    this.$progress.show();
    this.$debug.text('Assembing file blob: ', file.size);
    document.getElementById('file').click();
    document.getElementById('file').addEventListener('change', e => {
      const file = e.target.files[0];
      const fileSize = file.size;
      parseFile(file, parsedFile => {
        this.port.postMessage({
          type: 'restoreCache',
          payload: {
            fileSize,
            parsedFile
          }
        });
      });
    }, false);
  },
  resetBar() {
    this.$bar.set(0);
    this.$progress.show();
    this.$status.text('');
  }
});

const options = new Options({
  el: $('.container')
});

// 'click #save': 'saveOptions',
// 'click #cacheFollowing': 'cacheFollowing',
// 'click #cacheTags': 'cacheTags',
// 'click #cacheLikes': 'cacheLikes',
// 'click #resetCache': 'resetCache',
// 'click #defaultKeys': 'toggleKeys',
// 'click #setUser': 'setUser',
// 'click #downloadCache': 'downloadCache',
