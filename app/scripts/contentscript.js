import AutopaginatorComponent from './components/autopaginator/autopaginatorComponent';
import Bridge from './bridge';
import ComponentFetcher from './utils/componentFetcherUtil';
import ChromeMixin from './components/mixins/chromeTriggerMixin';
import TagSearchAutocompleteModel from './models/tagSearchAutocompleteModel';
import TextSearchAutocompleteModel from './models/textSearchAutocompleteModel';
import FilterDropdownTemplate from './components/filterPopover/search/filterDropdown/filterDropdownTemplate.html';
import FilterDropdownComponent from './components/filterPopover/search/filterDropdown/filterDropdownComponent';
import FilterIcon from './components/filterPopover/filterPopoverIcon';
import FilterMenuComponent from './components/filterPopover/filterMenu/filterMenuComponent';
import FilterMenuTemplate from './components/filterPopover/filterMenu/filterMenuTemplate.html';
import FilterPopoverComponent from './components/filterPopover/filterPopoverComponent';
import FilterPopoverContainer from './components/filterPopover/filterPopoverContainer';
import FollowerItem from './components/followerList/followerItem/followerItemComponent';
import FollowerList from './components/followerList/followerListComponent';
import FollowerModel from './models/followerModel';
import FollowerSearch from './components/followerList/followerSearch/followerSearchComponent';
import Events from './utils/eventsUtil';
import Init from './init';
import InputComponent from './components/filterPopover/search/input/inputComponent';
import LikesModel from './models/likesModel';
import Main from './main';
import PostFormatter from './utils/postFormatterUtil';
import PostModel from './models/postModel';
import PopoverMixin from './components/mixins/popoverMixin';
import PopoverTemplate from './components/popover/popoverTemplate.html';
import PopoverComponent from './components/popover/popoverComponent';
import LoaderComponent from './components/loader/loaderComponent';
import LoaderMixin from './components/mixins/loaderBarMixin';
import SearchComponent from './components/filterPopover/search/searchComponent';
import SearchResultsTemplate from './components/searchResults/searchResultsTemplate.html';
import SearchResultsComponent from './components/searchResults/searchResultsComponent';
import SearchTemplate from './components/filterPopover/search/searchTemplate.html';
import SettingsComponent from './components/filterPopover/settings/settingsComponent';
import StateModel from './models/stateModel';
import Time from './utils/timeUtil';
import ToggleComponent from './components/toggle/toggle';
import ToggleTemplate from './components/toggle/toggle.html';

// NOTE: reblog follow button is broken

const inject = modules => {
  for (let i = 0; modules.length > i; i += 1) {
    const module = modules[i];
    const app = document.createElement('script');
    app.setAttribute('type', 'text/javascript');
    app.appendChild(document.createTextNode('(' + module + ')(Tumblr, Backbone, _);'));
    (document.body || document.head || document.documentElement).appendChild(app);
  }
}

const injectTemplates = templates => {
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
    SearchTemplate,
    ToggleTemplate
  ]);

  inject([
    Init,
    ComponentFetcher,
    Events,
    Time,
    Main,
    PostFormatter,
    ChromeMixin,
    LoaderMixin,
    PopoverMixin,
    StateModel,
    FollowerModel,
    PostModel,
    LikesModel,
    ToggleComponent,
    PopoverComponent,
    AutopaginatorComponent, // depends on PostModel
    LoaderComponent, // must be loaded after PostModel or doesn't listen correctly
    TagSearchAutocompleteModel,
    TextSearchAutocompleteModel,
    FilterDropdownComponent,
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
