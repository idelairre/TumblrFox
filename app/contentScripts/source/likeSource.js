import { $ } from 'backbone';
import { omit, pick } from 'lodash';
import ChromeMixin from '../components/mixins/chromeMixin';
import Source from './source';

const LikeSource = Source.extend({
  mixins: [ChromeMixin],
  fetch(slug) { // NOTE: this is slightly confusing, fetch is more like a helper method and search is more like fetch
    if (typeof slug.term === 'undefined' || (slug.hasOwnProperty('term') && slug.term.length === 0)) {
      return this.filter(slug);
    }
    return this.filterByTerm(slug);
  },
  filter(slug) {
    const deferred = $.Deferred();
    this.chromeTrigger('chrome:search:likesByTag', slug, deferred.resolve);
    return deferred.promise();
  },
  filterByTerm(slug) {
    const deferred = $.Deferred();
    this.chromeTrigger('chrome:search:likesByTerm', slug, deferred.resolve);
    return deferred.promise();
  },
  search(query) {
    const deferred = $.Deferred();
    query = pick(query, 'blogname', 'before', 'filter_nsfw', 'limit', 'next_offset', 'post_role', 'post_type', 'sort', 'term');
    if (query.blogname === Tumblr.Prima.currentUser().id) {
      query = omit(query, 'blogname');
    }
    this.fetch(query).then(posts => {
      // setTimeout(() => {
        deferred.resolve(posts);
      // }, 250);
    });
    return deferred.promise();
  }
});

module.exports = new LikeSource();
