import { $ } from 'backbone';
import ChromeMixin from '../components/mixins/chromeMixin';
import Source from './source';

const { Tumblelog } = Tumblr.Prima.Models;
const { find, omit, pick } = _;

const FollowingSource = Source.extend({
  mixins: [ChromeMixin],
  collateData(following) {
    const when = $.Deferred();
    const promises = following.map(follower => {
      const deferred = $.Deferred();
      if (!follower.hasOwnProperty('avatar_url')) {
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
    $.when.apply($, promises).then((...responses) => {
      when.resolve([].concat(...responses));
    });
    return when.promise();
  },
  fetch(query) {
    const deferred = $.Deferred();
    this.chromeTrigger('chrome:fetch:following', query, response => {
      this.collateData(response).then(followers => {
        deferred.resolve(followers);
      });
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
      success: data => {
        const following = Array.prototype.slice.call($(data).find('.follower'));
        const response = [];
        following.forEach(follower => {
          follower = $(follower);
          const json = $(follower).find('[data-tumblelog-popover]').data('tumblelog-popover');
          if (json) {
            json.updated = follower.find('.description').text();
            response.push(json);
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
