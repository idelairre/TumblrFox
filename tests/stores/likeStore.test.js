import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import db from '../../app/background/lib/db';
import Likes from '../../app/background/stores/likeStore';
import Papa from '../../app/background/lib/papaParse';
import 'babel-polyfill';

describe('likeStore', () => {
  before(() => {
    Papa.parse('https://raw.githubusercontent.com/idelairre/TumblrFox/lunr/tests/fixtures/likes.csv', {
      download: true,
      delimiter: 'Ꮂ',
      newline: '',
      header: true,
      dynamicTyping: true,
      worker: false,
      comments: false,
      skipEmptyLines: true,
      complete: async (results, parse) => {
        const promises = results.data.map(post => {
          return Likes.put(post);
        });
        await Promise.all(promises);
        const count = await db.posts.toCollection().count();
      },
      error: e => {
        console.error(e);
      },
    });
  });
  describe('get()', () => {
    it ('should fetch posts by id', async () => {
      const post = await Likes.get(2331225184);
      expect(post.id).to.equal(2331225184);
    });
  });
  describe('fetch()', () => {
    it ('should return posts', async () => {
      const response = await Likes.fetch({
        post_type: 'ANY',
        post_role: 'ANY',
        next_offset: 0,
        limit: 10
      });
      expect(response.length).to.equal(10);
    });
    it ('should filter posts based on query parameters', async () => {
      const response = await Likes.fetch({
        post_type: 'PHOTO',
        post_role: 'ORIGINAL',
        filter_nsfw: true,
        next_offset: 0,
        limit: 10
      });
      expect(response).to.have.length(10);
      response.forEach(post => {
        expect(post).not.to.have.property('tumblelog-content-rating');
        expect(post.type).be.a('string').include('photo');
        expect(post.is_reblog).to.be.false;
      });
    });
    it ('should filter posts by blogname', async () => {
      const response = await Likes.fetch({
        blogname: 'aatropos',
        post_role: 'ANY',
        post_type: 'ANY',
        next_offset: 0,
        limit: 10
      });
      response.forEach(post => {
        expect(post.blog_name).to.be.a('string').equal('aatropos');
      });
    });
    it ('should order posts by popularity if specified', async () => {
      const response = await Likes.fetch({
        post_role: 'ANY',
        post_type: 'ANY',
        next_offset: 0,
        limit: 10,
        sort: 'POPULARITY_DESC'
      });
      for (let i = 0; response.length > i; i += 1) {
        if (response[i + 1]) {
          expect(response[i].note_count).to.be.gt(response[i + 1].note_count);
        } else {
          expect(response[i].note_count).to.be.lt(response[i - 1].note_count);
        }
      }
    });
  });
});
