import autopaginatorComponent from './components/autopaginator/autopaginatorComponent';
import bridge from './utils/bridge';
import componentFetcher from './utils/componentFetcher';
import tagSearchAutocompleteModel from './models/tagSearchAutocompleteModel';
import FilterTemplate from './components/filterPopover/filter/filterTemplate.html';
import filterComponent from './components/filterPopover/filter/filterComponent';
import FilterIcon from './components/filterPopover/filterPopoverIcon';
import filterMenuComponent from './components/filterPopover/filterMenu/filterMenuComponent';
import FilterMenuTemplate from './components/filterPopover/filterMenu/filterMenuTemplate.html';
import filterPopoverComponent from './components/filterPopover/filterPopoverComponent';
import filterPopoverContainer from './components/filterPopover/filterPopoverContainer';
import FilterPopoverTemplate from './components/filterPopover/filterPopoverTemplate.html';
import events from './utils/events';
import FilterIconTemplate from '../pages/icon/icon.html';
import main from './main.js';
import postFormatter from './utils/postFormatter';
import postModel from './models/postModel';
import loaderComponent from './components/loader/loaderComponent';
import loaderMixin from './mixins/loaderBar';
import searchComponent from './components/filterPopover/search/searchComponent';
import SearchTemplate from './components/filterPopover/search/searchTemplate.html'
import settingsComponent from './components/filterPopover/settings/settingsComponent';
import SettingsPopoverTemplate from './components/filterPopover/settings/settingsPopover/settingsPopoverTemplate.html';
import settingsPopoverComponent from './components/filterPopover/settings/settingsPopover/settingsPopoverComponent';

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
    postModel,
    postFormatter,
    componentFetcher,
    events,
    autopaginatorComponent,
    loaderComponent,
    main,
    loaderMixin,
    tagSearchAutocompleteModel,
    filterComponent,
    settingsPopoverComponent,
    settingsComponent,
    searchComponent,
    filterMenuComponent,
    filterPopoverComponent,
    filterPopoverContainer,
    FilterIcon
  ]);
}
