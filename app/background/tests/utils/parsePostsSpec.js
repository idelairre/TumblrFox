import { isEqual } from 'lodash';
import parsePosts from '../../utils/parsePosts';
import likesFixture from '../fixtures/likes-fixture.html';
import 'babel-polyfill';

describe('parsePosts()', () => {
  it ('should work', () => {
    const response = parsePosts(likesFixture);
    expect(response).toBeDefined();
  });

  it ('should parse posts into array', () => {
    const response = parsePosts(likesFixture);
    expect(Array.isArray(response)).toBe(true);
  });

  it ('posts should have custom tumblr post properties ', () => {
    const response = parsePosts(likesFixture);
    response.forEach(post => {
      expect(post.blog_name).toBeDefined();
      expect(post.note_count).toBeDefined();
      expect(post.tags).toBeDefined();
      expect(post.html).toBeDefined();
    });
  });
});
