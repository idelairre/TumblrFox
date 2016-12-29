
describe('BlogStore', () => {
  describe('fetch()', () => {
    it('should filter posts by type', async done => {
      spyOn(BlogSource, 'cacheFetch').and.returnValue(Promise.resolve(Generator.posts()));

      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO'
      };

      const response = await blogModel.fetch(query);
      const posts = response.map(post => {
        return post.type;
      });
      expect(posts).not.toContain(query.post_type.toLowerCase());
      done();
    });

    it('should filter posts by role', async done => {
      spyOn(BlogSource, 'cacheFetch').and.returnValue(Promise.resolve(Generator.posts()));

      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'ANY',
        post_role: 'ORIGINAL'
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      const response = await blogModel.fetch(query);
      const reblog = response.filter(post => {
        return post.is_reblog;
      });
      expect(reblog.length).toBe(0);
      done();
    });

    it('should filter posts by role and type', async done => {

      spyOn(BlogSource, 'cacheFetch').and.returnValue(Promise.resolve(Generator.posts()));

      const query = {
        blogname: Tumblr.Prima.currentUser().id,
        term: '',
        next_offset: 0,
        limit: 10,
        post_type: 'PHOTO',
        post_role: 'ORIGINAL'
      };

      Tumblr.Fox.options.set('cachedUserPosts', true);

      const response = await blogModel.fetch(query);
      const reblogs = response.map(post => {
        return post.is_reblog;
      });
      const types = response.map(post => {
        return post.type;
      });
      expect(reblogs).not.toContain(true);
      expect(types).toContain(jasmine.stringMatching(query.post_type.toLowerCase()));
      done();
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
          const name = post['tumblelog-parent-data'].name;
          if (!name) {
            return;
          }
          return blogModel.getContentRating(name);
        }), undefined);

        Promise.all(promises).then(responses => {
          responses.forEach(user => {
            expect(user.content_rating).not.toMatch('nsfw');
          });
          done();
        }).catch(err => console.error(err));
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
