/**
 * EmployeeDashboard - Dashboard for employees to submit and view their ideas
 */

import React, { useState } from 'react';
import { IdeaSubmissionForm } from '../components/IdeaSubmissionForm';
import { MyIdeas } from '../components/MyIdeas';

export const EmployeeDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleIdeaSubmitted = () => {
    // Trigger refresh by changing the key
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Employee Dashboard</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <IdeaSubmissionForm onSuccess={handleIdeaSubmitted} />
      </div>

      <div>
        <MyIdeas key={refreshKey} />
      </div>
    </div>
  );
};
