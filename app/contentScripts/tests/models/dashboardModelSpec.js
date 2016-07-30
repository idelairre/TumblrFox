import $ from 'jquery';
import { without } from 'lodash';
import AppState from '../../application/state';
import { BlogModel, DashboardModel } from '../../models/models';
import DashboardSource from '../../source/dashboardSource';

const dashboardModel = new DashboardModel({
  state: AppState
});

const blogModel = new BlogModel();

describe('DashboardModel', () => {
  describe('fetch()', () => {
    it('should filter by type', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        limit: 10
      };
      dashboardModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        response.posts.forEach(post => {
          expect(post.type).toEqual(query.post_type.toLowerCase());
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
      dashboardModel.fetch(query).then(response => {
        response.posts.forEach(post => {
          expect(post.reblogged_from_tumblr_url).toEqual(null);
        });
        done();
      });
    });

    it('should filter by content rating', done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        filter_nsfw: true,
        limit: 10
      };
      dashboardModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        // expect(response.length).toEqual(query.limit);
        const promises = without(response.posts.map(post => {
          if (!post.reblogged_from_name || !post.reblogged_from_name) {
            return;
          }
          const deferred = $.Deferred();
          blogModel.getContentRating(post.reblogged_from_name).then(response => {
            deferred.resolve(response);
          });
          return deferred.promise();
        }), undefined);
        $.when.apply($, promises).done((...response) => {
          const responses = [].concat(...response);
          responses.forEach(user => {
            expect(user.content_rating).not.toMatch('nsfw');
          });
          done();
        });
      });
    });
  });

  describe('search()', () => {
    it('should work', done => {
      const query = {
        term: 'me',
        limit: 10,
        next_offset: 0,
        post_type: 'ANY',
        post_role: 'ANY',
      };

      dashboardModel.search(query).then(response => {
        expect(response).toBeDefined();
        done();
      });
    });

    it('should filter by type', done => {
      const query = {
        term: 'me',
        limit: 10,
        next_offset: 0,
        post_type: 'QUOTE',
        post_role: 'ANY',
      };

      dashboardModel.search(query).then(response => {
        expect(response).toBeDefined();
        response.forEach(post => {
          expect(post.type).toMatch(/quote/);
        });
        done();
      });
    });

    it('should filter by role', done => {
      const query = {
        term: 'me',
        limit: 10,
        next_offset: 0,
        post_type: 'ANY',
        post_role: 'ORIGINAL',
      };

      dashboardModel.search(query).then(response => {
        response.forEach(post => {
          expect(post.reblogged_from_tumblr_url).toEqual(null);
        });
        done();
      });
    });
  });
});
