import AutopaginatorComponent from './components/autopaginator/autopaginatorComponent';
import bridge from './utils/bridge';
import componentFetcher from './utils/componentFetcher';
import ChromeMixin from './mixins/chromeTrigger';
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
import Events from './utils/events';
import main from './main.js';
import postFormatter from './utils/postFormatter';
import PostModel from './models/postModel';
import PopoverMixin from './mixins/popover';
import PopoverTemplate from './components/popover/popoverTemplate.html';
import PopoverComponent from './components/popover/popoverComponent';
import LoaderComponent from './components/loader/loaderComponent';
import LoaderMixin from './mixins/loaderBar';
import SearchComponent from './components/filterPopover/search/searchComponent';
import SearchResultsTemplate from './components/searchResults/searchResultsTemplate.html';
import SearchResultsComponent from './components/searchResults/searchResultsComponent';
import SearchTemplate from './components/filterPopover/search/searchTemplate.html'
import SettingsComponent from './components/filterPopover/settings/settingsComponent';
import Time from './utils/time';

// NOTE: reblog follow button is broken

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');

  bridge.initialize();

  function inject(modules) {
    for (let i = 0; modules.length > i; i += 1) {
      const module = modules[i];
      const app = document.createElement('script');
      app.setAttribute('id', module.name);
      app.setAttribute('type', 'text/javascript');
      app.appendChild(document.createTextNode('(' + module + ')();'));
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
    postFormatter,
    componentFetcher,
    Events,
    Time,
    main,
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
}
