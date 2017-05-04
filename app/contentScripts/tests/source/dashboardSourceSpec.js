import $ from 'jquery';
import DashboardSource from '../../source/dashboardSource';
import { isSorted } from '../../../shared/jasmine-helpers';

describe('DashboardSource', () => {
  describe('clientFetch()', () => {
    it ('should work', async done => {
      const response = await DashboardSource.clientFetch();
      expect(response).toBeDefined();
      done();
    });
  });
});
