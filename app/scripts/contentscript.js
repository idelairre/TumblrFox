import AutopaginatorComponent from './components/autopaginator/autopaginatorComponent';
import bridge from './utils/bridge';
import componentFetcher from './utils/componentFetcher';
import ChromeMixin from './mixins/chromeTrigger';
import tagSearchAutocompleteModel from './models/tagSearchAutocompleteModel';
import FilterTemplate from './components/filterPopover/filter/filterTemplate.html';
import filterComponent from './components/filterPopover/filter/filterComponent';
import FilterIcon from './components/filterPopover/filterPopoverIcon';
import filterMenuComponent from './components/filterPopover/filterMenu/filterMenuComponent';
import FilterMenuTemplate from './components/filterPopover/filterMenu/filterMenuTemplate.html';
import filterPopoverComponent from './components/filterPopover/filterPopoverComponent';
import filterPopoverContainer from './components/filterPopover/filterPopoverContainer';
import FilterPopoverTemplate from './components/filterPopover/filterPopoverTemplate.html';
import FollowerModel from './models/followerModel';
import FollowerList from './components/followerList/followerListComponent';
import FollowerItem from './components/followerList/followerItem/followerItemComponent';
import Events from './utils/events';
import FilterIconTemplate from '../pages/icon/icon.html';
import main from './main.js';
import postFormatter from './utils/postFormatter';
import PostModel from './models/postModel';
import LoaderComponent from './components/loader/loaderComponent';
import loaderMixin from './mixins/loaderBar';
import searchComponent from './components/filterPopover/search/searchComponent';
import SearchTemplate from './components/filterPopover/search/searchTemplate.html'
import settingsComponent from './components/filterPopover/settings/settingsComponent';
import SettingsPopoverTemplate from './components/filterPopover/settings/settingsPopover/settingsPopoverTemplate.html';
import settingsPopoverComponent from './components/filterPopover/settings/settingsPopover/settingsPopoverComponent';
import Time from './utils/time';

// NOTE: reblog follow button is broken

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');

  bridge.initialize();

  function inject(modules) {
    for (let i = 0; modules.length > i; i += 1) {
      const module = modules[i];
      const app = document.createElement('script');
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
    FilterTemplate,
    FilterMenuTemplate,
    FilterPopoverTemplate,
    FilterIconTemplate,
    SearchTemplate,
    SettingsPopoverTemplate
  ]);

  inject([
    postFormatter,
    componentFetcher,
    Events,
    Time,
    main,
    ChromeMixin,
    loaderMixin,
    FollowerModel,
    PostModel,
    AutopaginatorComponent, // depends on PostModel
    LoaderComponent, // must be loaded after PostModel or doesn't listen correctly
    tagSearchAutocompleteModel,
    filterComponent,
    settingsPopoverComponent,
    settingsComponent,
    searchComponent,
    filterMenuComponent,
    filterPopoverComponent,
    filterPopoverContainer,
    FilterIcon,
    FollowerItem,
    FollowerList
  ]);
}
