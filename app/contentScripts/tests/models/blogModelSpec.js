import $ from 'jquery';
import { without } from 'lodash';
import { BlogModel } from '../../models/models';
import BlogSource from '../../source/blogSource';
import Events from '../../application/events';

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
        response.posts.forEach(post => {
          expect(post.type).toMatch(/quote/);
        });
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
        response.posts.forEach(post => {
          expect(post.reblogged_from_tumblr_url).toBe(null);
        });
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
        expect(response.posts.length).toEqual(query.limit)
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
          expect(post.reblogged_from_tumblr_url).toBe(null);
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

    it('should be called when the blogname query equals the current user name', done => {
      spyOn(BlogSource, 'cacheFetch').and.returnValue($.Deferred().resolve());

      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY'
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      blogModel.fetch(query).then(() => {
        expect(BlogSource.cacheFetch).toHaveBeenCalled();
        done();
      });
    });

    it('should filter posts by type', done => {
      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO'
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      blogModel.fetch(query).then(response => {
        response.forEach(post => {
          expect(post.type).toMatch(query.post_type.toLowerCase());
        });
        done();
      });
    });

    it('should filter posts by role', done => {
      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        post_role: 'ORIGINAL'
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      blogModel.fetch(query).then(response => {
        response.forEach(post => {
          expect(post.is_reblog).toEqual(false);
        });
        done();
      });
    });

    it('should filter posts by role and type', done => {
      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO',
        post_role: 'ORIGINAL'
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      blogModel.fetch(query).then(response => {
        response.forEach(post => {
          expect(post.is_reblog).toEqual(false);
          expect(post.type).toEqual(jasmine.stringMatching(query.post_type.toLowerCase()));
        });
        done();
      });
    });

    it('should filter posts by content rating', done => {
      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO',
        filter_nsfw: true
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      blogModel.fetch(query).then(response => {
        const promises = without(response.map(post => {
          if (typeof post['tumblelog-parent-data'] === 'undefined') {
            return;
          }
          const deferred = $.Deferred();
          const name = post['tumblelog-parent-data'].name;
          if (!name) {
            return;
          }
          blogModel.getContentRating(name).then(response => {
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

    it('should sort posts by note count', done => {
      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO',
        filter_nsfw: false,
        sort: 'POPULARITY DESC'
      };

      const isSorted = array => {
        const len = array.length - 1;
        for (let i = 0; i < len; ++i) {
          if (array[i] > array[i + 1]) {
            return false;
          }
        }
        return true;
      }

      Tumblr.Fox.options.set('cachedUserPosts', true);

      blogModel.fetch(query).then(response => {
        expect(isSorted(response)).toEqual(true);
        done();
      });
    });

    it('should filter posts by role and content rating', done => { // can't do this yet due to Tumblr api limitations, just tests to make sure the response exists
      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        filter_nsfw: true,
        post_role: 'ORIGNAL'
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      blogModel.fetch(query).then(response => {
        expect(response).toBeDefined();
        expect(response.length).toEqual(query.limit);
        done();
      });
    });
  });
});
