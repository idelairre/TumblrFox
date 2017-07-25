import $ from 'jquery';
import { has } from 'lodash';
import AppState from '../../application/state';
import { BlogModel, DashboardModel } from '../../models/models';
import DashboardSource from '../../source/dashboardSource';

const dashboardModel = new DashboardModel({
  state: AppState
});

const blogModel = new BlogModel();

describe('DashboardModel', () => {
  describe('fetch()', () => {
    it('should filter by type', async done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        limit: 10
      };

      try {
        const { posts } = await dashboardModel.fetch(query);

        expect(posts).toBeDefined();

        for (let post in posts) {
          expect(posts[post].type).toEqual(query.post_type.toLowerCase());
        }

        done();
      } catch (err) {
        fail(err);
      }
    });

    it('should filter by post role', async done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        post_role: 'ORIGINAL',
        limit: 10
      };

      try {
        const { posts } = await dashboardModel.fetch(query);

        for (let post in posts) {
          expect(posts[post].reblogged_from_tumblr_url).toEqual(null);
        }

        done();
      } catch (err) {
        fail(err);
      }
    });

    it('should filter by content rating', async done => {
      const query = {
        post_type: 'PHOTO',
        next_offset: 0,
        filter_nsfw: true,
        limit: 10
      };

      try {
        const { posts } = await dashboardModel.fetch(query);

        expect(posts).toBeDefined();
        // expect(response.length).toEqual(query.limit);
        const promises = posts.filter(post => {
          if (has(post, 'reblogged_from_name')) {
            return blogModel.getContentRating(post.reblogged_from_name);
          }
        });

        const responses = await Promise.all(promises);

        for (let user in responses) {
          expect(responses[user].content_rating).not.toMatch('nsfw');
        }

        done();
      } catch (err) {
        fail(err);
      }
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

    it('should filter by type', async done => {
      const query = {
        term: 'me',
        limit: 10,
        next_offset: 0,
        post_type: 'QUOTE',
        post_role: 'ANY',
      };

      try {
        const response = await dashboardModel.search(query);

        expect(response).toBeDefined();

        for (let post in response) {
          expect(response[post].type).toMatch(/quote/);
        }

        done();
      } catch (err) {
        fail(err);
      }
    });

    it('should filter by role', async done => {
      const query = {
        term: 'me',
        limit: 10,
        next_offset: 0,
        post_type: 'ANY',
        post_role: 'ORIGINAL',
      };

      try {
        const response = await dashboardModel.search(query);

        for (let post in response) {
          expect(response[post].reblogged_from_tumblr_url).toEqual(null);
        }

        done();
      } catch (err) {
        fail(err);
      }
    });
  });
});
