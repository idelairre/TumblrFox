import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import Main from '../app/scripts/main';
import AutopaginatorComponent from '../app/scripts/components/autopaginator/autopaginatorComponent';
import ComponentFetcher from '../app/scripts/utils/componentFetcherUtil';
import Events from '../app/scripts/utils/eventsUtil';
import FilterComponent from '../app/scripts/components/filterPopover/filterDropdown/filterDropdownComponent';
import FilterIcon from '../app/scripts/components/filterPopover/filterPopoverIcon';
import FilterTemplate from '../app/scripts/components/filterPopover/filterDropdown/filterDropdownTemplate.html';
import FilterMenuComponent from '../app/scripts/components/filterPopover/filterMenu/filterMenuComponent';
import FilterMenuTemplate from '../app/scripts/components/filterPopover/filterMenu/filterMenuTemplate.html';
import FilterPopoverComponent from '../app/scripts/components/filterPopover/filterPopoverComponent';
import FilterPopoverContainer from '../app/scripts/components/filterPopover/filterPopoverContainer';
import LoaderComponent from '../app/scripts/components/loader/loaderComponent';
import LoaderMixin from '../app/scripts/mixins/loaderBarMixin';
import PostModel from '../app/scripts/models/postModel';
import PostFormatter from '../app/scripts/utils/postFormatterUtil';
import SearchTemplate from '../app/scripts/components/filterPopover/search/searchTemplate.html';
import SearchComponent from '../app/scripts/components/filterPopover/search/searchComponent';
import SettingsComponent from '../app/scripts/components/filterPopover/settings/settingsComponent';
import userFixture from './data/user.json';
import blogFixture from './data/blog.json';
import '../app/styles/popover.less';

chai.use(sinonChai);

let { Tumblelog } = Tumblr.Prima.Models;

let userModel = new Tumblelog(userFixture);

Tumblr.Prima.currentUser = function () {
  return userModel;
};

function initialize(dependencies) {
  for (let i = 0; dependencies.length > i; i += 1) {
    dependencies[i]();
  }
}

function injectTemplates(templates) {
  for (let i = 0; templates.length > i; i += 1) {
    document.body.insertAdjacentHTML('beforeend', templates[i]);
  }
}

injectTemplates([
  FilterTemplate,
  FilterMenuTemplate,
  SearchTemplate
]);

initialize([
  PostModel,
  PostFormatter,
  ComponentFetcher,
  Events,
  AutopaginatorComponent,
  LoaderComponent,
  Main,
  LoaderMixin,
  FilterComponent,
  SettingsComponent,
  SearchComponent,
  FilterMenuComponent,
  FilterPopoverComponent,
  FilterPopoverContainer,
  FilterIcon
]);

const context = require.context('.', true, /.+\.test\.js?$/);
context.keys().forEach(context);
module.exports = context;
