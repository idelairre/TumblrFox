import $ from 'jquery';

const processTags = post => {
  const tagElems = $(post).find('div.post_tags');
  if (tagElems && tagElems.length > 0) {
    const rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#').filter(tag => {
      if (tag !== '') {
        return tag;
      }
    });
    return rawTags;
  }
  return [];
};

const processPost = (postHtml, timestamp = false) => {
  const post = $(postHtml).data('json');
  post.id = parseInt(post.id, 10);
  post['is-tumblrfox-post'] = true;
  post.html = $(postHtml).prop('outerHTML');
  if (timestamp) {
    post.liked_timestamp = parseInt(timestamp, 10);
  }
  post.tags = processTags(postHtml) || [];
  post.note_count = $(postHtml).find('.note_link_current').data('count') || 0;
  post.blog_name = post.tumblelog;
  return post;
};

const parsePosts = (data, timestamp = false) => {
  try {
    const postsJson = [];
    const posts = Array.from($(data).find('[data-json]').not('[data-is-radar]'));
    posts.forEach(post => {
      post = processPost(post, timestamp);
      if (post.id) {
        postsJson.push(post);
      }
    });
    return postsJson;
  } catch (err) {
    console.error(err);
  }
};

export default parsePosts;
