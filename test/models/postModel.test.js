import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

Tumblr.Posts = new Backbone.Collection();

let { Posts } = Tumblr.Fox;

Posts.items = Tumblr.Posts;

describe('Posts', () => {
  describe('#initialize()', () => {
    it('should exist', () => {
      expect(Posts).to.exist;
    });
  });
});
