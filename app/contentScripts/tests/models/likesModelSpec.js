import $ from 'jquery';
import { LikesModel } from '../../models/models';
import DashboardSource from '../../source/likeSource';
import { isSorted } from '../../../shared/jasmine-helpers';

const likesModel = new LikesModel();

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
          expect(parseInt(query.before) > parseInt(post.liked_timestamp * 1000));
        });
        done();
      });
    });
  });
});
