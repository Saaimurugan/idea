/**
 * ImplementerDashboard - Dashboard for implementers to view and update assigned ideas
 */

import React from 'react';
import { AssignedIdeas } from '../components/AssignedIdeas';

export const ImplementerDashboard: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Implementer Dashboard</h1>
      <AssignedIdeas />
    </div>
  );
};
