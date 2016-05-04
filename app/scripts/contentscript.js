import autopaginatorComponent from './components/autopaginator/autopaginatorComponent';
import bridge from './utils/bridge';
import componentFetcher from './utils/componentFetcher';
import dashboardAutocompleteModel from './models/dashboardAutocompleteModel';
import filterTemplate from './components/filterPopover/filter/filterTemplate.html';
import filterComponent from './components/filterPopover/filter/filterComponent';
import filterMenuComponent from './components/filterPopover/filterMenu/filterMenuComponent';
import filterMenuTemplate from './components/filterPopover/filterMenu/filterMenuTemplate.html';
import filterPopoverComponent from './components/filterPopover/filterPopoverComponent';
import filterPopoverContainer from './components/filterPopover/filterPopoverContainer';
import filterPopoverTemplate from './components/filterPopover/filterPopoverTemplate.html';
import events from './utils/events';
import icon from '../pages/icon/icon.html';
import main from './main.js';
import postFormatter from './utils/postFormatter';
import postModel from './models/postModel';
import loaderComponent from './components/loader/loaderComponent';
import loaderMixin from './mixins/loaderBar';
import searchComponent from './components/filterPopover/search/searchComponent';
import searchTemplate from './components/filterPopover/search/searchTemplate.html'
import settingsComponent from './components/filterPopover/settings/settingsComponent';
import settingsPopoverTemplate from './components/filterPopover/settings/settingsPopover/settingsPopoverTemplate.html';
import settingsPopoverComponent from './components/filterPopover/settings/settingsPopover/settingsPopoverComponent';

// NOTE: reblog follow button is broken

if (window.location.href.includes('https://www.tumblr.com')) {
  console.log('@tumblr');
  const accountButton = document.querySelector('#account_button');
  accountButton.insertAdjacentHTML('afterend', icon);
  document.body.insertAdjacentHTML('beforeend', filterTemplate);
  document.body.insertAdjacentHTML('beforeend', filterMenuTemplate);
  document.body.insertAdjacentHTML('beforeend', filterPopoverTemplate);
  document.body.insertAdjacentHTML('beforeend', settingsPopoverTemplate);
  document.body.insertAdjacentHTML('beforeend', searchTemplate);

  bridge.initialize();

  function inject(modules) {
    for (let i = 0; modules.length > i; i += 1) {
      const module = modules[i];
      const app = document.createElement('script');
      app.appendChild(document.createTextNode('(' + module + ')();'));
      (document.body || document.head || document.documentElement).appendChild(app);
    }
  }

  inject([postModel, postFormatter, componentFetcher, events, autopaginatorComponent, loaderComponent, main, loaderMixin, dashboardAutocompleteModel, filterComponent, settingsPopoverComponent, settingsComponent, searchComponent, filterMenuComponent, filterPopoverComponent, filterPopoverContainer]);
}
