import App from '../app';
import FilterPopoverIcon from '../components/filterPopover/filterPopoverIcon';
import FollowingListComponent from '../components/followingList/followingListComponent';
import InfoComponent from '../components/info/infoComponent';
import FollowingModel from '../components/followingList/followingModel';
import { RouteController } from './router';
import { ComponentFetcher } from '../utils';

const Controller = RouteController.extend({
  initialize(options = {}) {
    Object.assign(this, options);
  },
  initializeFollowing() {
    App.Application.followingListComponent = new FollowingListComponent();
  },
  initializeInfo() {
    App.Application.infoComponent = new InfoComponent({
      options: this.options
    });
  },
  initializeTests() {
    const TestComponent = require('../components/testsView/testComponent');
    const testComponent = new TestComponent();
    App.Application.testComponent = testComponent;
    testComponent.render();
  },
  onDashboard() {
    this.state.setState('dashboard');
    if (this.options.get('test')) {
      this.initializeTests();
    } else {
      const followingModel = new FollowingModel();
      followingModel.fetchAll();
      App.Application.followingModel = followingModel;
      this.initializeInfo();
    }
  },
  onFollowing() {
    this.state.setState('disabled');
    this.initializeFollowing();
  },
  onBlog() {
    this.state.setState('user');
    this.initializeInfo();
  },
  onLikes() {
    this.state.setState('likes');
    this.initializeInfo();
  },
  defaultRoute() {
    this.state.setState('disabled');
  }
});

module.exports = Controller;
