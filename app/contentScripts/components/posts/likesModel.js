import { Model } from 'backbone';
import LikeSource from '../../source/likeSource';

const LikesModel = Model.extend({
  fetch(query) { // TODO: add a condition where it fetches normally from the page if the query is basically empty
    return LikeSource.fetch(query);
  },
  search(query) {
    return LikeSource.search(query);
  }
});

module.exports = LikesModel;
