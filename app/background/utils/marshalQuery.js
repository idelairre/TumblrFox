import { isNumber } from 'lodash';

const marshalQuery = query => {
  const type = query.post_type.toLowerCase();
  if (type === 'any') {
    delete query.post_type;
  } else if (type === 'text') {
    query.post_type = 'regular';
  } else if (type === 'answer') {
    query.post_type = 'note';
  } else if (type === 'chat') {
    query.post_type = 'conversation';
  } else {
    query.post_type = type;
  }
  if (!query.filter_nsfw) {
    delete query.filter_nsfw;
  }
  if (!query.sort) {
    delete query.sort;
  }
  if (query.post_role !== 'ORIGINAL') {
    delete query.post_role;
  }
  return query;
}

export default marshalQuery;
