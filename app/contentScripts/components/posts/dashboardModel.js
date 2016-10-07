import { $, Model } from 'backbone';
import { pick, take, union, last, first, uniq } from 'lodash';
import Filters from '../../utils/filtersUtil';
import BlogModel from './blogModel';
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
  reset() {
    DashboardSource.reset();
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
        const api = !(query.post_type === 'ANY' && query.term.length === 0);
        return Filters.applyFilters(query, response, api);
      });
    }
    const recursiveFetch = posts => {
      return filteredFetch().then(response => {
        posts = posts.concat(response).slice(0, query.limit);
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
  }
});

module.exports = DashboardModel;
