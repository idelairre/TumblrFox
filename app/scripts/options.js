import ProgressBar from 'progressbar.js';

function saveOptions() {
  let consumerKey = document.getElementById('consumerKey').value;
  let consumerSecret = document.getElementById('consumerSecret').value;
  let userName = document.getElementById('userName').value;
  chrome.storage.sync.set({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret,
    userName: userName
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
    consumerSecret: '',
    userName: '',
    totalFollowingCount: 0,
    totalLikedPostsCount: 0
  }, items => {
    document.getElementById('consumerKey').value = items.consumerKey;
    document.getElementById('consumerSecret').value = items.consumerSecret;
    document.getElementById('userName').value = items.userName;
    document.getElementById('totalFollowing').textContent = items.totalFollowingCount
    document.getElementById('totalLikes').textContent = items.totalLikedPostsCount
  });
  chrome.storage.local.get({
    cachedLikes: 0,
    cachedFollowing: 0
  }, items => {
    document.getElementById('following').textContent = items.cachedFollowing;
    document.getElementById('likes').textContent = items.cachedLikes;
  });
}

function cacheTags() {
  let progress = document.getElementById('container');
  progress.style.display = 'block';
  let status = document.getElementById('status');
  const port = chrome.runtime.connect({
    name: 'cacheTags'
  });
  port.onMessage.addListener(response => {
    let { percentComplete, itemsLeft } = response;
    if (percentComplete === 'done') {
      status.textContent = percentComplete;
      progress.style.display = 'none';
      return;
    }
    status.textContent = `items left: ${itemsLeft}`;
    bar.animate(percentComplete / 100);
  });
  status.textContent = '';
  port.postMessage({ type: 'cacheTags'});
}

function cacheLikes() {
  let progress = document.getElementById('container');
  progress.style.display = 'block';
  let status = document.getElementById('status');
  const port = chrome.runtime.connect({
    name: 'cacheLikes'
  });
  port.onMessage.addListener(response => {
    let { percentComplete, itemsLeft } = response;
    if (percentComplete === 'done') {
      status.textContent = percentComplete;
      progress.style.display = 'none';
      return;
    }
    status.textContent = `items left: ${itemsLeft}`;
    bar.animate(percentComplete / 100);
  });
  status.textContent = '';
  port.postMessage({ type: 'cacheLikes'});
}

function cacheFollowing() {
  let progress = document.getElementById('container');
  let status = document.getElementById('status');
  const port = chrome.runtime.connect({
    name: 'cacheFollowing'
  });
  progress.style.display = 'block';
  port.onMessage.addListener(response => {
    let { percentComplete, itemsLeft } = response;
    if (percentComplete === 'done') {
      status.textContent = percentComplete;
      progress.style.display = 'none';
      return;
    }
    status.textContent = `items left: ${itemsLeft}`;
    bar.animate(percentComplete / 100);
  });
  status.textContent = '';
  port.postMessage({ type: 'cacheFollowing'});
}

function resetCache() {
  chrome.storage.local.set({ posts: [] }, () => {
    let status = document.getElementById('status');
    status.textContent = 'done';
  });
}

let bar = new ProgressBar.Line(container, {
    strokeWidth: 4,
    easing: 'easeInOut',
    duration: 1400,
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: {
      width: '100%',
      height: '100%'
    },
    text: {
      style: {
        color: '#999',
        position: 'absolute',
        right: '0',
        top: '30px',
        padding: 0,
        margin: 0,
        transform: null
      },
      autoStyleContainer: false
    },
    from: {
      color: '#FFEA82'
    },
    to: {
      color: '#ED6A5A'
    },
    step: (state, bar) => {
      bar.setText(Math.round(bar.value() * 100) + ' %');
    }
});

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('cacheFollowing').addEventListener('click', cacheFollowing);
document.getElementById('cacheTags').addEventListener('click', cacheTags);
document.getElementById('cachePosts').addEventListener('click', cacheLikes);
document.getElementById('resetCache').addEventListener('click', resetCache);
