module.exports = {
  initialize() {
    window.addEventListener('chrome:fetch:blogPosts', e => {
      chrome.runtime.sendMessage({
        fetchBlogPosts: e.detail,
        type: 'blogPosts'
       }, response => {
        const slug = new CustomEvent('chrome:response:posts', {
          detail: response
        });
        window.dispatchEvent(slug);
      });
    });

    window.addEventListener('chrome:fetch:posts', e => {
      chrome.runtime.sendMessage({
        fetchPosts: e.detail,
        type: 'dashboardPosts'
       }, response => {
        const slug = new CustomEvent('chrome:response:posts', {
          detail: response
        });
        window.dispatchEvent(slug);
      });
    });

    window.addEventListener('chrome:fetch:likes', e => {
      chrome.runtime.sendMessage({
        fetchLikedPosts: e.detail,
        type: 'likedPosts'
       }, response => {
        const slug = new CustomEvent('chrome:response:posts', {
          detail: response
        });
        window.dispatchEvent(slug);
      });
    });

    window.addEventListener('chrome:fetch:tags', () => {
      chrome.runtime.sendMessage({
        type: 'likeTags'
       }, response => {
        const slug = new CustomEvent('chrome:response:tags', {
          detail: response
        });
        window.dispatchEvent(slug);
      });
    });
  }
}
