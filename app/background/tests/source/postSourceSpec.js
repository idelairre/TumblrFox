import { concat, every, find, isEqual } from 'lodash';
import { Generator } from 'tumblr-faker';
import ModuleInjector from 'inject!../../source/postSource';
import { isSorted } from '../../../shared/jasmine-helpers';

const user = new Generator.user({
  posts: 100
});

const oauthRequest = query => {
  const { response } = user.getDashboard(query);
  const { posts } = response;
  return Promise.resolve({ posts });
};

const usersFixture = user.posts.map(post => Generator.following(post.blog_name));

console.log(usersFixture);

const MockBlogSource = function () {
  this.users = usersFixture;
};

MockBlogSource.prototype.getInfo = function(name) {
  const found = find(this.users, {
    title: name
  });
  return Promise.resolve(found);
}

const BlogSource = new MockBlogSource();

const PostSource = ModuleInjector({
  '../lib/oauthRequest': { oauthRequest },
  './blogSource': BlogSource
}).default;

describe('PostSource', () => {
  describe('applyNsfwFilter()', () => {
    it ('should filter nsfw posts', async done => {
      const filtered = await PostSource.applyNsfwFilter(user.posts.slice(0, 10));
      expect(filtered).toBeDefined();
      const response = await Promise.all(filtered.map(async post => {
        const user = await BlogSource.getInfo(post.blog_name);
        return user.is_nsfw;
      }));
      expect(response).not.toContain(true);
      done();
    });
  });

  describe('fetchDashboardPosts()', () => {
    it ('should filter by content rating', async done => {
      const query = {
        next_offset: 0,
        limit: 10,
        filter_nsfw: true
      };
      const filtered = await PostSource.fetch(query);
      expect(filtered).toBeDefined();
      const response = await Promise.all(filtered.map(async post => {
        const user = await BlogSource.getInfo(post.blog_name);
        return user.is_nsfw;
      }));
      expect(response).not.toContain(true);
      done();
    });
  });

  describe('filteredFetch()', () => {
    it ('should return a promise', ()  => {
      const query = {
        next_offset: 0,
        limit: 10,
        filter_nsfw: true
      };
      expect(PostSource.filteredFetch(query) instanceof Promise).toBe(true);
    });

    it ('should filter by content rating and return the specified limit of posts', async done => {
      const query = {
        next_offset: 0,
        limit: 10,
        filter_nsfw: true
      };
      const response = await PostSource.filteredFetch(query);
      expect(response).toBeDefined();
      expect(response.length).toEqual(10);
      done();
    });
  });
});
