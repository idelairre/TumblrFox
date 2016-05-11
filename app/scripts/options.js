import ProgressBar from 'progressbar.js';

const status = document.getElementById('status');
const progress = document.getElementById('container');
const bar = new ProgressBar.Line(container, {
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
      bar.setText(`${Math.round(bar.value() * 100)}%`);
    }
});

function saveOptions() {
  const consumerKey = document.getElementById('consumerKey').value;
  const consumerSecret = document.getElementById('consumerSecret').value;
  const userName = document.getElementById('userName').value;
  chrome.storage.sync.set({ consumerKey, consumerSecret, userName }, () => {
    // Update status to let user know options were saved.
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
    document.getElementById('totalFollowing').textContent = items.totalFollowingCount;
    document.getElementById('totalLikes').textContent = items.totalLikedPostsCount;
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
  progress.style.display = 'block';
  const port = chrome.runtime.connect({
    name: 'cacheTags'
  });
  port.onMessage.addListener(response => {
    const { percentComplete, itemsLeft } = response;
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
  progress.style.display = 'block';
  const port = chrome.runtime.connect({
    name: 'cacheLikes'
  });
  port.onMessage.addListener(response => {
    const { percentComplete, itemsLeft } = response;
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
  const port = chrome.runtime.connect({
    name: 'cacheFollowing'
  });
  progress.style.display = 'block';
  port.onMessage.addListener(response => {
    const { percentComplete, itemsLeft } = response;
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
    status.textContent = 'done';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('cacheFollowing').addEventListener('click', cacheFollowing);
document.getElementById('cacheTags').addEventListener('click', cacheTags);
document.getElementById('cachePosts').addEventListener('click', cacheLikes);
document.getElementById('resetCache').addEventListener('click', resetCache);
