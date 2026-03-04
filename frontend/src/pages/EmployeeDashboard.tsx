/**
 * EmployeeDashboard - Dashboard for employees to submit and view their ideas
 */

import React from 'react';
import { IdeaSubmissionForm } from '../components/IdeaSubmissionForm';
import { MyIdeas } from '../components/MyIdeas';

export const EmployeeDashboard: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Employee Dashboard</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <IdeaSubmissionForm />
      </div>

      <div>
        <MyIdeas />
      </div>
    </div>
  );
};
