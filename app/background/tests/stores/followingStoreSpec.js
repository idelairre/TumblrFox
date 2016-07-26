import mockDb from '../fixtures/db';
import ModuleInjector from 'inject!../../stores/followingStore';
import { isEqual, sortBy } from 'lodash';

const Following = ModuleInjector({
  '../lib/db': mockDb,
}).default;

describe('FollowingStore', () => {
  describe('fetch()', () => {
    it ('should fetch all followers if the query is empty', async done => {
      const response = await Following.fetch();
      const count = await mockDb.following.count();
      expect(response.length).toEqual(count);
      done();
    });
  });
});
