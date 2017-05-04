import { Client, Generator } from 'tumblr-faker';
import db from '../fixtures/db';
import TagInjector from 'inject!../../stores/tagStore';
import BlogInjector from 'inject!../../stores/blogStore';
import LikesInjector from 'inject!../../stores/likeStore';

// NOTE: perhaps make a seperate mocks folder where these injected modules are exported?

const client = new Client({
  user: 'luxfoks',
  returnPromises: true,
  persistData: true
});

// const BlogSource = function() {
//   return {
//     getContentRating: client.blogInfo;
//   }
// };

const Tags = TagInjector({ '../lib/db': db }).default;
const Blogs = BlogInjector({
  '../lib/db': db
  // '../source/blogSource': BlogSource
}).default;
// const Likes = LikesInjector({ '../lib/db': db }).default;

const testBlog = new Generator.Blog({
  name: 'fucko',
  posts: 10
});

const testPosts = Generator.posts({ limit: 20 });

Blogs.bulkPut(testBlog.posts);
// Likes.bulkPut(testPosts);

describe('TagStore', () => {
  describe('fetchTagsByUser()', () => {
    it ('should fetch tags by user', async done => {
      try {
        const tags = await Tags.fetchTagsByUser('fucko');
        console.log(tags);
        done();
      } catch (err) {
        console.error(err);
      }
    });
  });
});
