import { concat, every, find, isEqual } from 'lodash';
import { Client, Generator } from 'tumblr-faker';
import ModuleInjector from 'inject!../../source/postSource';
import { isSorted } from '../../../shared/jasmine-helpers';

const user = new Generator.User({
  posts: 20
});

const client = new Client({
  returnPromises: true
});

const oauthRequest = query => {
  const { response } = user.getDashboard(query);
  return Promise.resolve({ posts: response.posts });
};

const usersFixture = user.posts.map(post => Generator.following(post.blog_name));

const PostSource = ModuleInjector({
  '../lib/oauthRequest': { oauthRequest },
  './blogSource': client
});

describe('PostSource', () => {
  describe('applyNsfwFilter()', () => {
    it ('should filter nsfw posts', async done => {
      const filtered = await PostSource.applyNsfwFilter(user.posts.slice(0, 10));
      expect(filtered).toBeDefined();
      done();
    });
  });
});
