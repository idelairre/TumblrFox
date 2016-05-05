import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import postsFixture from '../data/indashPosts.json';

const $ = Backbone.$;

let { Posts } = Tumblr.Fox;

Tumblr.Posts = new Backbone.Collection();

Posts.items = Tumblr.Posts;

describe('Posts', () => {
  describe('#initialize()', () => {
    it('should exist', () => {
      expect(Posts).to.exist;
    });
  });
  describe('#clientFetchPosts()', () => {
    it('should trigger a fox:postFetch:finished event', (done) => {
      sinon.stub($, 'ajax').yieldsTo('success', {
        response: {
          posts: postsFixture
        }
      });
      let eventCallback = sinon.spy();
      sinon.stub(Tumblr.Fox, 'formatDashboardPost');
      sinon.stub(Posts, 'renderPosts'); // not sure why these aren't called
      sinon.stub(Posts, 'renderPost');
      Tumblr.Events.on('fox:postFetch:finished', eventCallback);
      const slug = { blogNameOrId: Tumblr.Prima.currentUser().id };
      Posts.clientFetchPosts(slug);
      setTimeout(() => {
        expect(eventCallback).to.have.been.called;
        // expect(Tumblr.Fox.formatDashboardPost).to.have.been.called;
        done();
      }, 1);
    });
  });
});
