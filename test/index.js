import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import AutopaginatorComponent from '../app/scripts/components/autopaginator/autopaginatorComponent';
import Bridge from '../app/scripts/utils/bridgeUtil';
import componentFetcher from '../app/scripts/utils/componentFetcherUtil';
import ChromeMixin from '../app/scripts/mixins/chromeTriggerMixin';
import TagSearchAutocompleteModel from '../app/scripts/models/tagSearchAutocompleteModel';
import FilterDropdownTemplate from '../app/scripts/components/filterPopover/filterDropdown/filterDropdownTemplate.html';
import FilterDropdownComponent from '../app/scripts/components/filterPopover/filterDropdown/filterDropdownComponent';
import FilterIcon from '../app/scripts/components/filterPopover/filterPopoverIcon';
import filterMenuComponent from '../app/scripts/components/filterPopover/filterMenu/filterMenuComponent';
import FilterMenuTemplate from '../app/scripts/components/filterPopover/filterMenu/filterMenuTemplate.html';
import filterPopoverComponent from '../app/scripts/components/filterPopover/filterPopoverComponent';
import filterPopoverContainer from '../app/scripts/components/filterPopover/filterPopoverContainer';
import FollowerItem from '../app/scripts/components/followerList/followerItem/followerItemComponent';
import FollowerList from '../app/scripts/components/followerList/followerListComponent';
import FollowerModel from '../app/scripts/models/followerModel';
import FollowerSearch from '../app/scripts/components/followerList/followerSearch/followerSearchComponent';
import Events from '../app/scripts/utils/eventsUtil';
import Init from '../app/scripts/init';
import Main from '../app/scripts/main';
import postFormatter from '../app/scripts/utils/postFormatterUtil';
import PostModel from '../app/scripts/models/postModel';
import PopoverMixin from '../app/scripts/mixins/popoverMixin';
import PopoverTemplate from '../app/scripts/components/popover/popoverTemplate.html';
import PopoverComponent from '../app/scripts/components/popover/popoverComponent';
import LoaderComponent from '../app/scripts/components/loader/loaderComponent';
import LoaderMixin from '../app/scripts/mixins/loaderBarMixin';
import SearchComponent from '../app/scripts/components/filterPopover/search/searchComponent';
import SearchResultsTemplate from '../app/scripts/components/searchResults/searchResultsTemplate.html';
import SearchResultsComponent from '../app/scripts/components/searchResults/searchResultsComponent';
import SearchTemplate from '../app/scripts/components/filterPopover/search/searchTemplate.html';
import SettingsComponent from '../app/scripts/components/filterPopover/settings/settingsComponent';
import Time from '../app/scripts/utils/timeUtil';
import userFixture from './data/user.json';
import blogFixture from './data/blog.json';
import '../app/styles/popover.less';

chai.use(sinonChai);

let { Tumblelog } = Tumblr.Prima.Models;

let userModel = new Tumblelog(userFixture);

Tumblr.Prima.currentUser = function () {
  return userModel;
};

function inject(modules) {
  for (let i = 0; modules.length > i; i += 1) {
    const module = modules[i];
    const app = document.createElement('script');
    app.setAttribute('type', 'text/javascript');
    app.appendChild(document.createTextNode('(' + module + ')(Tumblr, Backbone, _);'));
    (document.body || document.head || document.documentElement).appendChild(app);
  }
}

function injectTemplates(templates) {
  for (let i = 0; templates.length > i; i += 1) {
    document.body.insertAdjacentHTML('beforeend', templates[i]);
  }
}

injectTemplates([
  FilterDropdownTemplate,
  FilterMenuTemplate,
  PopoverTemplate,
  SearchResultsTemplate,
  SearchTemplate
]);

inject([
  Init,
  postFormatter,
  componentFetcher,
  Events,
  Time,
  Main,
  ChromeMixin,
  LoaderMixin,
  PopoverMixin,
  FollowerModel,
  PostModel,
  PopoverComponent,
  AutopaginatorComponent, // depends on PostModel
  LoaderComponent, // must be loaded after PostModel or doesn't listen correctly
  TagSearchAutocompleteModel,
  FilterDropdownComponent,
  SettingsComponent,
  SearchComponent,
  SearchResultsComponent,
  filterMenuComponent,
  filterPopoverComponent,
  filterPopoverContainer,
  FilterIcon,
  FollowerItem,
  FollowerSearch,
  FollowerList
]);

const context = require.context('.', true, /.+\.test\.js?$/);
context.keys().forEach(context);
module.exports = context;
