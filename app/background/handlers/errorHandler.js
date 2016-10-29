import sendMessage from '../services/messageService';

const errorHandler = e => {
  e.preventDefault();
  const { reason } = e;
  sendMessage({
    type: 'error',
    payload: 'Unhandled promise rejection: ' + (reason && (reason.stack || reason)),
  });
};

export default errorHandler;
