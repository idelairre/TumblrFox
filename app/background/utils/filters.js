const filters = (query, post) => {
  if (query.blogname && query.blogname !== '') {
    if (!post.blog_name.toLowerCase().includes(query.blogname.toLowerCase())) {
      return false;
    }
  }
  if (query.post_type && query.post_type !== 'any') {
    if (!post.type.includes(query.post_type)) {
      return false;
    }
  }
  if (query.post_role && query.post_role === 'ORIGINAL') {
    if (post.is_reblog) {
      return false;
    }
  }
  if (query.filter_nsfw) {
    if (post['tumblelog-content-rating'] === 'nsfw' || post['tumblelog-content-rating'] === 'adult') {
      return false;
    }
  }
  if (query.before) {
    if (post.hasOwnProperty('liked_timestamp')) {
      if (!(query.before > post.liked_timestamp)) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

export const filterNsfw = post => {
  if (post.hasOwnProperty('tumblelog-content-rating') && post['tumblelog-content-rating'] === 'nsfw' || post['tumblelog-content-rating'] === 'adult') {
    return false;
  }
  return true;
}

export const filterReblogs = post => {
  return !post.is_reblog;
}

export default filters;
