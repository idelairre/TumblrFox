import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

let { SearchComponent } = Tumblr.Fox;

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
    it('should extend the input subview with the tagSearchAutocompleteModel', () => {
    });
    it('should extend the filter subview with custom popover code', () => {
    });
  });
  describe('#updateSearchSettings()', () => {
    it('should update its subview functionality on state change', () => {
    });
  });
});
