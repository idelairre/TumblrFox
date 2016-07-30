import { concat, every, find, isEqual } from 'lodash';
import { generateUser } from '../fixtures/tumblelog';
import { generatePosts } from '../fixtures/post';
import ModuleInjector from 'inject!../../source/postSource';
import { isSorted } from '../../../shared/jasmine-helpers';
import 'babel-polyfill';

const postsFixture = generatePosts(100);
const usersFixture = postsFixture.map(post => { return generateUser(post.blog_name) });

const oauthRequest = query => {
  const posts = query.type ? every(postsFixture, {
    type: query.type
  }).slice(query.offset, query.offset + query.limit) : postsFixture.slice(query.offset, query.offset + query.limit);
  return Promise.resolve({ posts });
};

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
      const filtered = await PostSource.applyNsfwFilter(postsFixture.slice(0, 10));
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
