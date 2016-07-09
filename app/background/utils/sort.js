const sortByPopularity = posts => {
  return posts.sort((a, b) => {
    return a.note_count - b.note_count;
  }).reverse();
}

export default sortByPopularity;
