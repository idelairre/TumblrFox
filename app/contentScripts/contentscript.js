/* global chrome:true */
/* global document:true */
/* global window:true */

import AutopaginatorModel from './models/autopaginatorModel';
import Bridge from './bridge';
import BlogModel from './models/blogModel';
import BlogSource from './source/blogSource';
import ComponentFetcher from './utils/componentFetcherUtil';
import DashboardModel from './models/dashboardModel';
import DashboardSource from './source/dashboardSource';
import ChromeMixin from './components/mixins/chromeTriggerMixin';
import ControllerModel from './models/controllerModel';
import TagSearchAutocompleteModel from './components/filterPopover/search/input/tagSearchAutocompleteModel';
import FiltersComponent from './components/filterPopover/search/filters/filtersComponent';
import FiltersDropdownTemplate from './components/filterPopover/search/filtersDropdown/filtersDropdownTemplate.html';
import FiltersDropdownComponent from './components/filterPopover/search/filtersDropdown/filtersDropdownComponent';
import FilterIcon from './components/filterPopover/filterPopoverIcon';
import FilterMenuComponent from './components/filterPopover/filterMenu/filterMenuComponent';
import FilterMenuTemplate from './components/filterPopover/filterMenu/filterMenuTemplate.html';
import FilterPopoverComponent from './components/filterPopover/filterPopoverComponent';
import FilterPopoverContainer from './components/filterPopover/filterPopoverContainer';
import FollowerItemTemplate from './components/followerList/followerItem/followerItemTemplate.html';
import FollowerItem from './components/followerList/followerItem/followerItemComponent';
import FollowerList from './components/followerList/followerListComponent';
import FollowerModel from './components/followerList/followerModel';
import FollowerSearch from './components/followerList/followerSearch/followerSearchComponent';
import EventsListener from './listeners/eventsListener';
import App from './app';
import InputComponent from './components/filterPopover/search/input/inputComponent';
import LikesListener from './listeners/likesListener';
import LikesModel from './models/likesModel';
import Main from './main';
import ObjectUtil from './utils/objectUtil';
import PostFormatter from './utils/postFormatterUtil';
import PostView from './components/postView/postView';
import PostViewTemplate from './components/postView/postViewTemplate.html';
import PostsModel from './models/postsModel';
import PopoverMixin from './components/mixins/popoverMixin';
import PopoverTemplate from './components/popover/popoverTemplate.html';
import PopoverComponent from './components/popover/popoverComponent';
import LoaderComponent from './components/loader/loaderComponent';
import LoaderMixin from './components/mixins/loaderBarMixin';
import LikeSource from './source/likeSource';
import SearchComponent from './components/filterPopover/search/searchComponent';
import SearchModel from './models/searchModel';
import SearchResultsTemplate from './components/searchResults/searchResultsTemplate.html';
import SearchResultsComponent from './components/searchResults/searchResultsComponent';
import SearchTemplate from './components/filterPopover/search/searchTemplate.html';
import SettingsComponent from './components/filterPopover/search/settings/settingsComponent';
import StateModel from './models/stateModel';
import TemplateFetcher from './utils/templateFetcherUtil';
import Time from './utils/timeUtil';
import ToggleComponent from './components/popover/toggle/toggle';
import ToggleTemplate from './components/popover/toggle/toggle.html';

const inject = modules => {
  for (let i = 0; modules.length > i; i += 1) {
    const module = modules[i];
    const app = document.createElement('script');
    app.setAttribute('type', 'text/javascript');
    app.appendChild(document.createTextNode(`(${module})(Tumblr, Backbone, _);`));
    (document.body || document.head || document.documentElement).appendChild(app);
  }
};

const injectTemplates = templates => {
  for (let i = 0; templates.length > i; i += 1) {
    document.body.insertAdjacentHTML('beforeend', templates[i]);
  }
};

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');

  const inExtension = chrome.runtime.onMessage;

  if (inExtension) {
    Bridge.initialize();
  }

  injectTemplates([
    FiltersDropdownTemplate,
    FilterMenuTemplate,
    FollowerItemTemplate,
    PopoverTemplate,
    PostViewTemplate,
    SearchResultsTemplate,
    SearchTemplate,
    ToggleTemplate
  ]);

  inject([
    App,
    ComponentFetcher,
    TemplateFetcher,
    Main,
    LikesListener,
    EventsListener,
    Time,
    ObjectUtil,
    PostFormatter,
    ChromeMixin,
    LoaderMixin,
    PopoverMixin,
    ControllerModel,
    StateModel,
    BlogSource,
    BlogModel,
    DashboardSource,
    DashboardModel,
    FollowerModel,
    LikeSource,
    LikesModel,
    AutopaginatorModel,
    LoaderComponent, // must be loaded after PostModel or doesn't listen correctly
    SearchModel,
    PostsModel,
    PostView,
    ToggleComponent,
    PopoverComponent,
    TagSearchAutocompleteModel,
    FiltersDropdownComponent,
    FiltersComponent,
    InputComponent,
    SettingsComponent,
    SearchComponent,
    SearchResultsComponent,
    FilterMenuComponent,
    FilterPopoverComponent,
    FilterPopoverContainer,
    FilterIcon,
    FollowerItem,
    FollowerSearch,
    FollowerList
  ]);
}
