import browser from '../lib/browserPolyfill';

let tumblr = null;

const initializeTab = response => {
  const tab = response[0];
  if (tab) {
    tumblr = tab.id;
  }
}

browser.tabs.query({
  url: 'https://www.tumblr.com/*',
}).then(initializeTab);

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  browser.tabs.query({
    url: 'https://www.tumblr.com/*',
  }).then(initializeTab);
});

const sendMessage = payload => {
  if (!tumblr) {
    return;
  }
  
  browser.tabs.sendMessage(tumblr, payload).then(response => {
    if (response) {
      console.log(response);
    }
  });
}


export default sendMessage;
