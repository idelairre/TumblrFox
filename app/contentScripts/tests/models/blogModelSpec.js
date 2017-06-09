import $ from 'jquery';
import { has } from 'lodash';
import { Generator } from 'tumblr-faker';
import { BlogModel } from '../../models/models';
import BlogSource from '../../source/blogSource';
import Events from '../../application/events';
import { isSorted } from '../jasmine/jasmine-helpers';
import 'babel-polyfill';

const blogModel = new BlogModel();
const Tumblr = window.Tumblr;

describe('BlogModel', () => {
  it('should exist', () => {
    expect(blogModel).toBeDefined();
  });

  it('should get user\'s content ratings', async done => {
    try {
      const response = await blogModel.getContentRating('banshee-hands');
      expect(response).toBeDefined();
      expect(response.content_rating).toEqual('nsfw');
      done();
    } catch (err) {
      fail(err);
    }
  });

  it('should set its blogname attribute on the "fox:changeUser" event', () => {
    const blogname = 'thethingaboutprogramming';
    Events.trigger('fox:changeUser', blogname);
    expect(blogModel.get('blogname')).toEqual(blogname);
  });

  describe('fetch()', () => {
    it('should filter posts by type', async done => {
      const query = {
        blogname: 'banshee-hands',
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'QUOTE'
      };

      try {
        const { posts } = await blogModel.fetch(query);

        for (let post in posts) {
          expect(posts[post].type).toMatch(/quote/);
        }

        done();
      } catch (err) {
        fail(err);
      }
    });

    it('should filter posts by role', async done => {
      const query = {
        blogname: 'thethingaboutprogramming',
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        post_role: 'ORIGINAL'
      };

      try {
        const response = await blogModel.fetch(query);
        expect(response).toBeDefined(response);
        expect(response.posts.length).toEqual(query.limit);
        response.posts.forEach(post => expect(post.reblogged_from_tumblr_url).toBe(null));
        done();
      } catch (err) {
        fail(err);
      }
    });

    it('should filter posts by content rating', async done => {
      const query = {
        blogname: 'banshee-hands',
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO',
        filter_nsfw: true
      };

      try {
        const { posts } = await blogModel.fetch(query);

        expect(posts).toBeDefined();

        const responses = await Promise.all(posts.filter(post => {
          if (has(post, 'reblogged_from_name')) {
            return blogModel.getContentRating(post.reblogged_from_name);
          }
        }));

        for (let user in responses) {
          expect(responses[user].content_rating).not.toMatch('nsfw');
        }
        done();
      } catch (err) {
        fail(err);
      }
    });

    it('should filter posts by both content rating and role', async done => { // NOTE: not possible at the moment, this just tests to make sure it doesn't break
      const query = {
        blogname: 'lochnessmonster',
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        filter_nsfw: true,
        post_role: 'ORIGINAL'
      };

      try {
        const { posts } = await blogModel.fetch(query);
        expect(posts.length).toEqual(query.limit);
        done();
      } catch (err) {
        fail(err);
      }
    });
  }, 5000);

  describe('search()', () => {
    it('should filter posts by role', async done => {
      const query = {
        blogname: 'lochnessmonster',
        term: 'gf',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        post_role: 'ORIGINAL'
      };

      try {
        const response = await blogModel.fetch(query);

        expect(response).toBeDefined();

        for (let post in response) {
          expect(response[post].reblogged_from_tumblr_url).toBe(null);
        }

        done();
      } catch (err) {
        fail(err);
      }
    });

    it('should filter posts by content rating', async done => {
      const query = {
        blogname: 'lonerboner',
        term: 'me',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO',
        filter_nsfw: true
      };

      try {
        const response = await blogModel.search(query);
        const responses = await Promise.all(response.filter(post => {
          if (has(post, 'reblogged_from_name')) {
            return blogModel.getContentRating(post.reblogged_from_name);
          }
        }));

        for (let user in response) {
          expect(response[user].content_rating).not.toMatch('nsfw');
        }

        done();
      } catch (err) {
        fail(err);
      }
    });
  });

  describe('cacheFetch()', () => {
    it('should not be called if the user\'s posts are not cached', async done => {
      spyOn(BlogSource, 'cacheFetch');

      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY'
      };

      Tumblr.Fox.options.set('cachedUserPosts', false);

      try {
        await blogModel.fetch(query);
        expect(BlogSource.cacheFetch).not.toHaveBeenCalled();
        done();
      } catch (err) {
        fail(err);
      }
    });

    it('should be called when the blogname query equals the current user name', async done => {
      spyOn(BlogSource, 'cacheFetch').and.returnValue(Promise.resolve());

      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY'
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      try {
        await blogModel.fetch(query);
        expect(BlogSource.cacheFetch).toHaveBeenCalled();
        done();
      } catch (err) {
        fail(err);
      }
    });
  });
});
