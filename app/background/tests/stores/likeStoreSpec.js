import mockDb from '../fixtures/db';
import ModuleInjector from 'inject!../../stores/likeStore';
import 'babel-polyfill';

const Likes = ModuleInjector({
  '../lib/db': mockDb,
}).default;

describe('LikeStore', () => {
  describe('get()', () => {
    it ('should fetch posts by id', async done => {
      const id = 92701077434;
      const post = await Likes.get(id);
      expect(post.id).toEqual(id);
      done();
    });
  });
  describe('fetch()', () => {
    it ('should return posts', async done => {
      const response = await Likes.fetch({
        post_type: 'ANY',
        post_role: 'ANY',
        next_offset: 0,
        limit: 10
      });
      expect(response.length).toEqual(10);
      done();
    });
    it ('should filter posts based on query parameters', async done => {
      const response = await Likes.fetch({
        post_type: 'PHOTO',
        post_role: 'ORIGINAL',
        filter_nsfw: true,
        next_offset: 0,
        limit: 10
      });
      expect(response.length).toEqual(4);
      response.forEach(post => {
        expect(post['tumblelog-content-rating']).toBeUndefined();
        expect(post.type).toMatch(/photo/);
        expect(post.is_reblog).toEqual(false);
      });
      done();
    });
    it ('should filter posts by blogname', async done => {
      const response = await Likes.fetch({
        blogname: 'karlamonteroo',
        post_role: 'ANY',
        post_type: 'ANY',
        next_offset: 0,
        limit: 10
      });
      response.forEach(post => {
        expect(post.blog_name).toMatch(/karlamonteroo/);
      });
      done();
    });
    it ('should order posts by popularity if specified', async done => {
      const response = await Likes.fetch({
        post_role: 'ANY',
        post_type: 'ANY',
        next_offset: 0,
        limit: 10,
        sort: 'POPULARITY_DESC'
      });
      for (let i = 0; response.length > i; i += 1) {
        if (response[i + 1]) {
          expect(response[i].note_count > response[i + 1].note_count).toEqual(true);
        } else {
          expect(response[i].note_count < response[i - 1].note_count).toEqual(true);
        }
      }
      done();
    });
    it ('should only return liked posts', async done => {
      const response = await Likes.fetch({
        post_role: 'ANY',
        post_type: 'ANY',
        next_offset: 0,
        limit: 10,
        sort: 'POPULARITY_DESC'
      });
      response.forEach(post => {
        expect(post.liked).toEqual(true);
      });
      done();
    });
  });
});
