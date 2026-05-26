import React from 'react';

const FeedbackContext = React.createContext({
  notify: () => {},
  clearNotifications: () => {},
  confirm: async () => false,
});

export default FeedbackContext;
