/**
 * ReviewerDashboard - Dashboard for reviewers to review and assign ideas
 */

import React from 'react';
import { ReviewIdeas } from '../components/ReviewIdeas';

export const ReviewerDashboard: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Reviewer Dashboard</h1>
      <ReviewIdeas />
    </div>
  );
};
