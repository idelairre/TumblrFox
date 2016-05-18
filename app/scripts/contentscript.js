import AutopaginatorComponent from './components/autopaginator/autopaginatorComponent';
import Bridge from './utils/bridgeUtil';
import componentFetcher from './utils/componentFetcherUtil';
import ChromeMixin from './mixins/chromeTriggerMixin';
import TagSearchAutocompleteModel from './models/tagSearchAutocompleteModel';
import FilterDropdownTemplate from './components/filterPopover/filterDropdown/filterDropdownTemplate.html';
import FilterDropdownComponent from './components/filterPopover/filterDropdown/filterDropdownComponent';
import FilterIcon from './components/filterPopover/filterPopoverIcon';
import filterMenuComponent from './components/filterPopover/filterMenu/filterMenuComponent';
import FilterMenuTemplate from './components/filterPopover/filterMenu/filterMenuTemplate.html';
import filterPopoverComponent from './components/filterPopover/filterPopoverComponent';
import filterPopoverContainer from './components/filterPopover/filterPopoverContainer';
import FollowerItem from './components/followerList/followerItem/followerItemComponent';
import FollowerList from './components/followerList/followerListComponent';
import FollowerModel from './models/followerModel';
import FollowerSearch from './components/followerList/followerSearch/followerSearchComponent';
import Events from './utils/eventsUtil';
import Init from './init';
import LikesModel from './models/likesModel';
import Main from './main';
import PostFormatter from './utils/postFormatterUtil';
import PostModel from './models/postModel';
import PopoverMixin from './mixins/popoverMixin';
import PopoverTemplate from './components/popover/popoverTemplate.html';
import PopoverComponent from './components/popover/popoverComponent';
import LoaderComponent from './components/loader/loaderComponent';
import LoaderMixin from './mixins/loaderBarMixin';
import SearchComponent from './components/filterPopover/search/searchComponent';
import SearchResultsTemplate from './components/searchResults/searchResultsTemplate.html';
import SearchResultsComponent from './components/searchResults/searchResultsComponent';
import SearchTemplate from './components/filterPopover/search/searchTemplate.html';
import SettingsComponent from './components/filterPopover/settings/settingsComponent';
import Time from './utils/timeUtil';

// NOTE: reblog follow button is broken

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

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');

  Bridge.initialize();

  injectTemplates([
    FilterDropdownTemplate,
    FilterMenuTemplate,
    PopoverTemplate,
    SearchResultsTemplate,
    SearchTemplate
  ]);

  inject([
    Init,
    componentFetcher,
    Events,
    Time,
    Main,
    PostFormatter,
    ChromeMixin,
    LoaderMixin,
    PopoverMixin,
    FollowerModel,
    PostModel,
    LikesModel,
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
}
