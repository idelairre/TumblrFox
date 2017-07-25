import sendMessage from '../services/messageService';

const errorHandler = function (e) {
  // e.preventDefault();
  console.error.apply(console, arguments);
  // const { reason } = e;
  // sendMessage({
  //   type: 'error',
  //   payload: 'Unhandled promise rejection: ' + (reason && (reason.stack || reason)),
  // });
};

export default errorHandler;
