import $ from 'jquery';
import { has } from 'lodash';
import Tumblr from 'tumblr';
import BlogSource from './blogSource';
import ChromeMixin from '../components/mixins/chromeMixin';
import Source from './source';

const { Tumblelog } = Tumblr.Prima.Models;

function preventJS(html) {
  return html.replace(/<script(?=(\s|>))/i, '<script type="text/xml" ');
}

const FollowingSource = Source.extend({
  mixins: [ChromeMixin],
  collateData(following) { // NOTE: what we want is something that fits the client Tumblelog model, this transforms api follower items into tumblelogs
    const promises = following.map(follower => {
      const deferred = $.Deferred();

      if (!has(follower, 'avatar_url')) { // NOTE: this is weird
        BlogSource.getInfo(follower.name).then(tumblelog => {
          tumblelog.updated = follower.updated;

          if (tumblelog.following) {
            this.update(tumblelog);
          }

          return deferred.resolve(tumblelog);
        });
      }
      return deferred.resolve(follower);
    });

    return Promise.all(promises).then(response => {
      return response;
    });
  },
  fetch(query) {
    const deferred = $.Deferred();
    this.chromeTrigger('chrome:fetch:following', query, response => {
      this.collateData(response).then(deferred.resolve);
    });
    return deferred.promise();
  },
  update(following) {
    this.chromeTrigger('chrome:following:update', following);
  },
  pageFetch(query) {
    const deferred = $.Deferred();
    $.ajax({
      type: 'GET',
      url: `https://www.tumblr.com/following/${query.offset}`,
      contentType: 'text/plain',
      success: data => {
        const following = Array.from($(preventJS(data)).find('.follower'));
        const response = following.map(follower => {
          const json = $(follower).find('[data-tumblelog-popover]').data('tumblelog-popover');

          if (json) {
            json.updated = $(follower).find('.description').text();
            return json;
          }
        });
        deferred.resolve(response);
      },
      error: error => {
        console.error(error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }
});

module.exports = new FollowingSource();
