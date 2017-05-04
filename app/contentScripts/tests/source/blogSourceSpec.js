import $ from 'jquery';
import BlogSource from '../../source/blogSource';
import { isSorted } from '../../../shared/jasmine-helpers';

describe('DashboardSource', () => {
  describe('apiFetch()', () => {
    it ('should work', async done => {
      const query = { blogname: 'luxfox', limit: 12 };
      const response = await BlogSource.apiFetch(query);
      expect(response).toBeDefined();
      done();
    });
  });
});
