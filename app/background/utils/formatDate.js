const formatDate = date => {
  return new Date(date * 1000).toLocaleDateString();
};

export default formatDate;
