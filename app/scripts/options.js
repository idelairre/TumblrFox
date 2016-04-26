function saveOptions() {
  let consumerKey = document.getElementById('consumerKey').value;
  let consumerSecret = document.getElementById('consumerSecret').value;
  chrome.storage.sync.set({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret
  }, () => {
    // Update status to let user know options were saved.
    let status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get({
    consumerKey: '',
    consumerSecret: ''
  }, (items) => {
    document.getElementById('consumerKey').value = items.consumerKey;
    document.getElementById('consumerSecret').value = items.consumerSecret;
  });
}
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
