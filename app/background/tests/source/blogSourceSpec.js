import ModuleInjector from 'inject!../../source/blogSource';
import generateTumblelog from '../fixtures/tumblelog';
import 'babel-polyfill';

const oauthRequest = name => {
  const user = generateTumblelog(name);
  return Promise.resolve({
    response: {
      blog: user
    }
  });
};

const BlogSource = ModuleInjector({
  '../lib/oauthRequest': { oauthRequest }
}).default;

describe('BlogSource', () => {
  describe('getInfo()', () => {
    it ('should return the user\'s info', async done => {
      const response = await BlogSource.getInfo('banshee-hands');
      expect(response).toBeDefined();
      expect(response.is_nsfw).toBeDefined();
      done();
    });
  });

  describe('getContentRating()', () => {
    it ('should return a hash with the user\'s content rating', async done => {
      const response = await BlogSource.getContentRating('banshee-hands');
      expect(response.content_rating).toBeDefined();
      done();
    });
  });
});
