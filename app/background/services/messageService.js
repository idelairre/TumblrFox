let tumblr = null;

const initializeTab = response => {
  const tab = response[0];
  if (tab) {
    tumblr = tab.id;
  }
}

chrome.tabs.query({
  url: 'https://www.tumblr.com/*',
}, initializeTab);

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  chrome.tabs.query({
    url: 'https://www.tumblr.com/*',
  }, initializeTab);
});

const sendMessage = payload => {
  if (!tumblr) {
    return;
  }
  chrome.tabs.sendMessage(tumblr, payload, response => {
    if (response) {
      console.log(response);
    }
  });
}


export default sendMessage;
