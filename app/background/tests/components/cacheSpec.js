import $ from 'jquery';
import { Model } from 'backbone';
import Cache from '../../components/cache/cache';
import constants from '../../constants';
import optionsHtml from '../fixtures/options.html';

const fixture = setFixtures(optionsHtml);

let cache;

describe('Cache', () => {
  beforeAll(() => {
    cache = new Cache({
      model: new Model(constants.toJSON()),
      el: fixture.find('[data-subview="cache"]')
    });
  });

  afterAll(() => {
    cache.remove();
  });

  it ('should work', () => {
    cache.render();
    expect(cache.$el).toBeDefined();
  });

  describe('render()', () => {
    it ('should initialize the date input value', () => {
      cache.render();

      const date = cache.$el.find('[type=date]');
      expect(date.val()).toMatch('2007-02-01');
    });
  });
});
