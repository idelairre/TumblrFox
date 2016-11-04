import { isEqual, sortBy, without } from 'lodash';
import mockDb from '../fixtures/db';
import ModuleInjector from 'inject!../../stores/followingStore';
import { isSorted } from '../../../shared/jasmine-helpers';

const Following = ModuleInjector({
  '../lib/db': mockDb
}).default;

describe('FollowingStore', () => {
  describe('fetch()', () => {
    it ('should fetch all followers if the query is empty', async done => {
      const response = await Following.fetch();
      const count = await mockDb.following.count();
      expect(response.length).toEqual(count);
      done();
    });

    it ('should sort followers by last update time', async done => {
      const response = await Following.fetch({
        order: 'recentlyUpdated',
        limit: 10,
        offset: 0
      });
      const updatedArray = without(response.map(user => {
        return user.updated;
      }).reverse(), undefined);
      expect(isSorted(updatedArray)).toBe(true);
      done();
    });
  });
});
