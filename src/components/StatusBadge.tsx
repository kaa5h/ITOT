import React from 'react';
import { RequestStatus } from '../types';

interface StatusBadgeProps {
  status: RequestStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'discussion-active':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'blocked':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'it-review':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'complete':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'discussion-active':
        return 'Discussion Active';
      case 'blocked':
        return 'Blocked';
      case 'it-review':
        return 'IT Review';
      case 'complete':
        return 'Complete';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusStyles()}`}
    >
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;
