import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

let { SearchComponent } = Tumblr.Fox

let searchComponent = new SearchComponent({
  blogname: Tumblr.Prima.currentUser().id,
  blog: Tumblr.Prima.Models.Tumblelog.collection.models[0]
});

describe('SearchComponent', () => {
  describe('#initialize()', () => {
    it('should exist', () => {
      expect(searchComponent).to.exist;
      expect(searchComponent.model).to.exist;
    });
  });
});
