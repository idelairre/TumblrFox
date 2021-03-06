import $ from 'jquery';
import { View } from 'backbone';
import { pick } from 'lodash';
import { ComponentFetcher } from '../../utils';
import FilterPopoverContainer from './filterPopoverContainer';

// TODO: replace base64 encoded image string with a require

const filterIconTemplate = `
  <script id="filterIconTemplate" type="text/template">
    <button tabindex="8" class="tab_anchor" style="margin-top: 0px" aria-haspopup="true" title="TumblrFox">
      <i class="tumblr-fox-icon-container" style="font-size: 20px">
        <img class="tumblr-fox-icon" height="20px" width="20px" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGcAAABpCAYAAAAnSz2JAAACkklEQVR42u3c0U3DMBDGcW/BGKzBGIzBGozRNToGY6C+RElkGtEHqIJoEvv8ne9/z0jE3+/OTZM0KVG+Kt+KJGwz34Qzz/OJ2MSGIf8oorOB2YUDUL267kznwzgA1Z+aQzgA1YU5jANQPZgiONd98p14y8MUwWF66sAUwwFo15nZhxkOQGWnpjgOQMm+2fPGIn7DRt+KwzU4wybPOwoKowzzzoLEIL98oKARxokOVD23XKCAEcaJdgZn1tC5UAEjjBMByDyrXLjAEcb56x9nRyXTxFYL9Ixj1QBmOGtncMCI4Hjc3lpnYx6WFyCFXJoEpQ50f2yXy+UpDM7awTxyn92i1p4watWwTTtYcXpUmrU5jtoZnFKjJoW9X+XzRzEHyWBad22Lzz9ZnJZAyg2aIu/5rc7MXOK0/lautG5JnGEYnltcaFRryqT6Td363onqmmUvo1jdq1der6trXDUePwJHoNOVzsy6wSkF5K0J3eCM4/hy5Dg9NqAbnCOfF57X5/q28X/H631t7h5ZevSY7/9mmqZX9zgegVbOzN56aLougbqGud3TOCkv6LpNffa6TacIC+sWxvsC1Y977btbCCCVx6yqTo1XoFAwnhYdEmapZZ/MlB6Mx9/VhIIBSBwGIAc4AAnDACQOA5A4DDjCMACJwwD0XfIvRWdqAr0TBhiA4sDc7qmcgWF6gAHody1v9Ug9FFMDEDDRgVKvpf68clgY79OTohQwAJW6mHlOEYupAQiYvWXx/kxgOpoeRESBkBAFKvabGYCYmjBApC4KRNqiOCQtCkTCwkCkKwpEqqJApCkKRIqiOCQoCkRyokDL61ZITRSItESBSEkUiHQa1/LGQmAcTQ+JiALJ/2iWoqiK9QXVEo0oBz0DhAAAAABJRU5ErkJggg==" />
      </i>
    </button>
    <span class="tab_notice tab-notice--outlined">
      <span class="tab_notice_value"></span>
    </span>
  </script>`;

const FilterIcon = View.extend({
  template: $(filterIconTemplate).html(),
  className: 'tab iconic tab_filtered_posts',
  name: 'filter',
  id: 'filter',
  events: {
    'click button': 'togglePopover'
  },
  initialize(options) {
    Object.assign(this, pick(options, ['options', 'state']));
    this.options.set('initialized', true);
    this.render();
  },
  render() {
    this.$el.html(this.template);
    $('.tab_bar').append(this.$el);
    this.popover = new FilterPopoverContainer({
      viewOptions: {
        state: this.state,
        options: this.options
      }
    });
    this.$tabNotice = this.$el.find('.tab_notice');
    this.bindEvents();
  },
  bindEvents() {
    if (this.options.get('firstRun')) {
      this.$tabNotice.prop('class', 'tab_notice tab-notice--outlined new_post_notice_container  tab-notice--active');
      this.$tabNotice.find('.tab_notice_value').text(this.options.get('version'));
      setTimeout(() => {
        this.$tabNotice.fadeOut(1000).promise().then(() => {
          Tumblr.Fox.updateConstants({
            firstRun: false
          });
        });
      }, 1500);
    }
  },
  togglePopover() {
    if (!this.options.get('rendered')) {
      this.popover.render();
      this.options.set('rendered', true);
      return;
    }
    this.popover.show();
  }
});

module.exports = FilterIcon;
