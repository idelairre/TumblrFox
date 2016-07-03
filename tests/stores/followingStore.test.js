import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import db from '../../app/background/lib/db';
import Following from '../../app/background/stores/followingStore';
import 'babel-polyfill';

describe('fetch', () => {
  it ('should fetch all followers if the query is empty', async () => {
    const response = await Following.fetch();
  });
  it ('should return followers alphabetically if specified', async () => {
    const response = await Following.fetch({
      order: 'alphabetically',
      offset: 0,
      limit: 10
    });
  });
});
