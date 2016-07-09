const filters = (query, post) => {
  if (query.blogname && query.blogname !== '') {
    return post.blog_name.toLowerCase().includes(query.blogname.toLowerCase());
  }
  if (query.post_type && query.post_type !== 'any') {
    return post.type.includes(query.post_type);
  }
  if (query.post_role && query.post_role === 'ORIGINAL') {
    if (post.is_reblog) {
      return false;
    }
  }
  if (query.filter_nsfw) {
    if (post.hasOwnProperty('tumblelog-content-rating') && post['tumblelog-content-rating'] === 'nsfw' || post['tumblelog-content-rating'] === 'adult') {
      return false;
    }
  }
  if (query.before) {
    if (!((query.before / 1000) >= post.liked_timestamp)) {
      return false;
    }
  }
  return true;
}

export default filters;
