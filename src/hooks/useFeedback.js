import { useContext } from 'react';
import FeedbackContext from '@context/FeedbackContext';

export default function useFeedback() {
  return useContext(FeedbackContext);
}
