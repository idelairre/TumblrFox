import $ from 'jquery';
import LikesModel from '../../posts/likesModel';
import DashboardSource from '../../../source/likeSource';

const likesModel = new LikesModel();

const isSorted = array => {
  const len = array.length - 1;
  for (let i = 0; i < len; ++i) {
    if (array[i] > array[i + 1]) {
      return false;
    }
  }
  return true;
}

describe('LikesModel', () => {
  describe('fetch()', () => {
    it('should filter by type', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        limit: 10
      };
      likesModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        response.forEach(post => {
          expect(post.type).toMatch(/photo/);
        });
        done();
      });
    });

    it('should filter by post role', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        post_role: 'ORIGINAL',
        limit: 10
      };
      likesModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        response.forEach(post => {
          expect(post.is_reblog).toEqual(false);
        });
        done();
      });
    });

    it('should filter by content rating', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        post_role: 'ORIGINAL',
        filter_nsfw: true,
        limit: 10
      };
      likesModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        response.forEach(post => {
          expect(post['tumblelog-content-rating']).not.toBeDefined();
        });
        done();
      });
    });

    it('should sort by popularity', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        post_role: 'ORIGINAL',
        filter_nsfw: true,
        limit: 10,
        sort: 'POPULARITY_DESC'
      };

      likesModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        expect(isSorted(response)).toEqual(true);
        done();
      });
    });
  });

  describe('search()', () => {
    it('should filter by type', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        limit: 10,
        term: 'me'
      };
      likesModel.search(query).then(response => {
        expect(response).toBeDefined();
        response.forEach(post => {
          expect(post.type).toMatch(/photo/);
        });
        done();
      });
    });

    it('should filter by content rating', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        limit: 10,
        filter_nsfw: true,
        term: 'art'
      };
      likesModel.search(query).then(response => {
        expect(response).toBeDefined();
        response.forEach(post => {
          expect(post['tumblelog-content-rating']).not.toBeDefined();
        });
        done();
      });
    });

    it('sort by popularity', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        limit: 10,
        filter_nsfw: true,
        term: 'art'
      };
      likesModel.search(query).then(response => {
        expect(response).toBeDefined();
        expect(isSorted(response)).toEqual(true);
        done();
      });
    });

    it('should filter by date', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        limit: 10,
        filter_nsfw: true,
        term: 'art',
        before: 13569984000
      };
      likesModel.search(query).then(response => {
        expect(response).toBeDefined();
        response.forEach(post => {
          console.log('post timestamp: ', new Date(post.liked_timestamp * 1000), 'before: ', new Date(query.before * 1000));
          expect(parseInt(query.before) > parseInt(post.liked_timestamp * 1000));
        });
        done();
      });
    });
  });
});
