import $ from 'jquery';
import { without } from 'lodash';
import { Generator } from 'tumblr-faker';
import { BlogModel } from '../../models/models';
import BlogSource from '../../source/blogSource';
import Events from '../../application/events';
import { isSorted } from '../../../shared/jasmine-helpers';

const blogModel = new BlogModel();
const Tumblr = window.Tumblr;

describe('BlogModel', () => {
  it('should exist', () => {
    expect(blogModel).toBeDefined();
  });

  it('should get user\'s content ratings', done => {
    blogModel.getContentRating('banshee-hands').then(response => {
      expect(response).toBeDefined();
      expect(response.content_rating).toEqual('nsfw');
      done();
    });
  });

  it('should set its blogname attribute on the "fox:changeUser" event', () => {
    const blogname = 'thethingaboutprogramming';
    Events.trigger('fox:changeUser', blogname);
    expect(blogModel.get('blogname')).toEqual(blogname);
  });

  describe('fetch()', () => {
    it('should filter posts by type', done => {
      const query = {
        blogname: 'banshee-hands',
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'QUOTE'
      };
      blogModel.fetch(query).then(response => {
        response.posts.forEach(post => expect(post.type).toMatch(/quote/));
        done();
      });
    });

    it('should filter posts by role', done => {
      const query = {
        blogname: 'thethingaboutprogramming',
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        post_role: 'ORIGINAL'
      };
      blogModel.fetch(query).then(response => {
        expect(response).toBeDefined(response);
        expect(response.posts.length).toEqual(query.limit);
        response.posts.forEach(post => expect(post.reblogged_from_tumblr_url).toBe(null));
        done();
      });
    });

    it('should filter posts by content rating', done => {
      const query = {
        blogname: 'banshee-hands',
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO',
        filter_nsfw: true
      };
      blogModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        // expect(response.length).toEqual(query.limit);
        const promises = without(response.posts.map(post => {
          if (typeof post.reblogged_from_name === 'undefined' || !post.reblogged_from_name) {
            return;
          }
          return blogModel.getContentRating(post.reblogged_from_name);
        }), undefined);

        Promise.all(promises).then(responses => {
          responses.forEach(user => {
            expect(user.content_rating).not.toMatch('nsfw');
          });
          done();
        }).catch(err => console.error(err));
      });
    });

    it('should filter posts by both content rating and role', done => { // NOTE: not possible at the moment, this just tests to make sure it doesn't break
      const query = {
        blogname: 'lochnessmonster',
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        filter_nsfw: true,
        post_role: 'ORIGINAL'
      };
      blogModel.fetch(query).then(response => {
        expect(response.posts.length).toEqual(query.limit);
        done();
      });
    });
  });

  describe('search()', () => {
    it('should filter posts by role', done => {
      const query = {
        blogname: 'lochnessmonster',
        term: 'gf',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        post_role: 'ORIGINAL'
      };
      blogModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        response.forEach(post => {
          expect(post.reblogged_from_tumblr_url).toBe(null)
        });
        done();
      });
    });

    it('should filter posts by content rating', done => {
      const query = {
        blogname: 'lonerboner',
        term: 'me',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO',
        filter_nsfw: true
      };

      blogModel.search(query).then(response => {
        const promises = without(response.map(post => {
          if (!post.reblogged_from_name) {
            return;
          }
          return blogModel.getContentRating(post.reblogged_from_name);
        }), undefined);

        Promise.all(promises).then(responses => {
          responses.forEach(user => {
            expect(user.content_rating).not.toMatch('nsfw');
          });
          done();
        }).catch(err => console.error(err));
      });
    });
  });

  describe('cacheFetch()', () => {
    it('should not be called if the user\'s posts are not cached', done => {
      spyOn(BlogSource, 'cacheFetch');

      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY'
      };

      Tumblr.Fox.options.set('cachedUserPosts', false);

      blogModel.fetch(query).then(() => {
        expect(BlogSource.cacheFetch).not.toHaveBeenCalled();
        done();
      });
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

      await blogModel.fetch(query);
      expect(BlogSource.cacheFetch).toHaveBeenCalled();
      done();
    });
  });
});
