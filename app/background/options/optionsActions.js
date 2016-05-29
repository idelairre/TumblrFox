const optionsActions = response => {
  console.log(response);
  switch(response.type) {
    case 'replyConstants':
      Backbone.Events.trigger('INITIALIZED', response);
      break;
    case 'done':
      Backbone.Events.trigger('HIDE_PROGRESS');
      Backbone.Events.trigger('DONE', response);
      break;
    case 'error':
      Backbone.Events.trigger('SHOW_ERROR', response);
      break;
    case 'progress':
      Backbone.Events.trigger('ANIMATE_PROGRESS', response);
      break;
    case 'cacheUploaded':
      Backbone.Events.trigger('CACHE_UPLOADED', response);
      break;
    case 'cacheConverted':
      Backbone.Events.trigger('CACHE_CONVERTED', response);
      break;
    case 'restoringCache':
      Backbone.Events.trigger('RESTORING_CACHE', response);
      break;
  }
}

export default optionsActions;
