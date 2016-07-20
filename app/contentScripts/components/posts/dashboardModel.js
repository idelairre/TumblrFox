import { $, Model } from 'backbone';
import { pick, take, union, last, first, uniq } from 'lodash';
import DashboardSource from '../../source/dashboardSource';
import Utils from '../../utils';

const DashboardModel = Model.extend({
  initialize(options) {
    Object.assign(this, pick(options, 'state'));
    if (this.state.get('disabled')) {
      return;
    }
    this.postViews = Tumblr.postsView;
    this.posts = this.postViews.postViews;
    this.initializeAttributes();
  },
  initializeAttributes() {
    this.posts.map(Utils.PostFormatter.parseTags);
    this.posts.forEach(post => {
      post.model.set('html', $(post.$el).prop('outerHTML'));
    });
  },
  dashboardFetch() {
    return DashboardSource.clientFetch();
  },
  _fetch(query) {
    if (query.post_type === 'ANY' && query.term.length === 0) {
      return DashboardSource.clientFetch();
    }
    return DashboardSource.fetch(query);
  },
  fetch(query) { // TODO: move this into dashboard souce, I don't want to see async shit in my models
    let posts = [];
    const deferred = $.Deferred();
    const filteredFetch = () => {
      return this._fetch(query).then(response => {
        return this._applyFilters(query, response);
      });
    }
    const recursiveFetch = posts => {
      return filteredFetch().then(response => {
        posts = take(posts.concat(response), query.limit);
        if (posts.length < query.limit) {
          query.next_offset += 15;
          return recursiveFetch(posts);
        } else {
          deferred.resolve({ posts, query });
        }
      });
    }
    recursiveFetch(posts);
    return deferred.promise();
  },
  search(query) {
    return DashboardSource.search(query);
  },
  _applyFilters(query, posts) { // NOTE: dashboard fetches are filtered in the background script
    const deferred = $.Deferred();
    const promises = [];
    if (query.post_role === 'ORIGINAL') {
      deferred.resolve(this._filterByRole(posts));
    } else {
      deferred.resolve(posts);
    }
    return deferred.promise();
  },
  _filterByRole(posts) {
    return posts.filter(post => {
      if (post.hasOwnProperty('is_reblog') && post['is_reblog'] || post.hasOwnProperty('reblogged_from_name')) {
        return;
      }
      return post;
    });
  }
});

module.exports = DashboardModel;
