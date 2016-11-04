import ModuleInjector from 'inject!../../source/blogSource';
import { Client } from 'tumblr-faker';

const client = new Client({
  user: 'luxfoks',
  returnPromises: true,
  persistData: true
});

const oauthRequest = name => {
  return client.blogInfo(name);
};

const BlogSource = ModuleInjector({
  '../lib/oauthRequest': { oauthRequest }
}).default;

describe('TestBlogSource', () => {
  it ('should correctly mock oauth requests', done => {
    const response = await BlogSource.getInfo('luxfoks');
    expect(response).toBeDefined();
    done();
  });
});

describe('BlogSource', () => {
  describe('getInfo()', () => {
    it ('should return the user\'s info', async done => {
      try {
        const response = await BlogSource.getInfo('banshee-hands');
        expect(response).toBeDefined();
        expect(response.is_nsfw).toBeDefined();
        done();
      } catch (err) {
        console.error(err);
      }
    });
  });

  describe('getContentRating()', () => {
    it ('should return a hash with the user\'s content rating', async done => {
      try {
        const { content_rating } = await BlogSource.getContentRating('banshee-hands');
        expect(content_rating).toBeDefined();
        done();
      } catch (err) {
        console.error(err);
      }
    });
  });
});
