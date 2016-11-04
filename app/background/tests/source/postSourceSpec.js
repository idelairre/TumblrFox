import { Client, Generator } from 'tumblr-faker';
import db from '../fixtures/db';
import ModuleInjector from 'inject!../../source/postSource';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

const client = new Client({
  user: 'luxfoks',
  returnPromises: true,
  persistData: true
});

const oauthRequest = query => {
  return client.userDashboard(query);
};

const BlogSource = {
  async getInfo() {
    const { blog } = await client.blogInfo.apply(client, arguments);
    return blog;
  },
  blogRequest() { // NOTE: this needs to parse arguments
    return client.blogPosts.apply(client, arguments);
  }
};

const PostSource = ModuleInjector({
  '../lib/oauthRequest': { oauthRequest },
  '../lib/db': db,
  './blogSource': BlogSource
}).default; // NOTE: need this default, maybe there is a plugin to fix this

describe('TestPostSource', () => {
  it ('should mock oauth correctly', async done => {
    const posts = await PostSource.fetch({
      next_offset: 0,
      limit: 10
    });
    expect(posts).toBeDefined();
    done();
  });

  it ('should mock BlogSource correctly', async done => {
    try {
      const info = await BlogSource.getInfo('luxfoks');
      expect(info).toBeDefined();
      expect(info.is_nsfw).toBeDefined();
      done();
    } catch (err) {
      console.error(err);
    }
  });
});

describe('PostSource', () => {
  describe('applyNsfwFilter()', () => {
    it ('should work', async done => {
      try {
        const posts = await PostSource.fetch({
          next_offset: 0,
          limit: 10
        });
        const filtered = await PostSource.applyNsfwFilter(posts);
        expect(filtered).toBeDefined();
        done();
      } catch (err) {
        console.error(err);
      }
    });

    it ('should filter nsfw posts', async done => {
      try {
        const posts = await PostSource.fetch({
          next_offset: 0,
          limit: 10
        });

        const filtered = await PostSource.applyNsfwFilter(posts);

        const results = (await Promise.all(filtered.map(post => BlogSource.getInfo(post.blog_name)))).map(user => {
          return user.is_nsfw;
        });

        expect(results).not.toContain(true);

        done();
      } catch (err) {
        console.error(err);
      }
    });
  });

  describe('fetch()', () => {
    it ('should automatically call applyNsfwFilter()', async done => {
      spyOn(PostSource, 'applyNsfwFilter').and.callThrough();

      await PostSource.fetch({
        next_offset: 0,
        limit: 10,
        filter_nsfw: true
      });

      expect(PostSource.applyNsfwFilter).toHaveBeenCalled();
      done();
    });
  });
});
