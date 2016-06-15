let tumblr = {};

chrome.tabs.query({
  url: 'https://www.tumblr.com/*',
}, response => {
  const tab = response[0];
  tumblr = tab.id;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  console.log('[TAB ID]', tabId);
  chrome.tabs.query({
    url: 'https://www.tumblr.com/*',
  }, response => {
    const tab = response[0];
    tumblr = tab.id;
  });
});

const sendMessage = payload => {
  chrome.tabs.sendMessage(tumblr, payload , response => {
    if (response) {
      console.log(response);
    }
  });
}

export default sendMessage;
