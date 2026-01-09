import React from 'react';
import {  Priority, RequestStatus, Activity, Message } from '../types';
import { AlertCircle, ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-react';

// Priority Badge Component - JIRA style
export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const icons = {
    Critical: <AlertCircle className="w-3 h-3" />,
    High: <ArrowUp className="w-3 h-3" />,
    Medium: <Minus className="w-3 h-3" />,
    Low: <ArrowDown className="w-3 h-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${styles[priority]}`}
    >
      {icons[priority]}
      {priority}
    </span>
  );
};

// Status Badge Component - JIRA style with colors
export const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  const styles = {
    draft: 'bg-gray-100 text-gray-800 border-gray-300',
    'to-do': 'bg-gray-100 text-gray-800 border-gray-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    blocked: 'bg-red-100 text-red-800 border-red-300',
    review: 'bg-purple-100 text-purple-800 border-purple-300',
    complete: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  const labels = {
    draft: 'Draft',
    'to-do': 'To Do',
    'in-progress': 'In Progress',
    blocked: 'Blocked',
    review: 'Review',
    complete: 'Complete',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// Issue Card Component for Kanban Board
interface IssueCardProps {
  id: string;
  assetName: string;
  description: string;
  priority: Priority;
  assignedTo: string;
  createdBy: string;
  onClick?: () => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  id,
  assetName,
  description,
  priority,
  assignedTo,
  createdBy,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 mb-2 hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{id}</span>
        <PriorityBadge priority={priority} />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">{assetName}</h3>
      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {assignedTo.split(' ').map(n => n[0]).join('')}
          </div>
          <span>{assignedTo.split(' ')[0]}</span>
        </div>
        <span className="text-gray-400">by {createdBy.split(' ')[0]}</span>
      </div>
    </div>
  );
};

// Activity Feed Item Component - JIRA style
interface ActivityItemProps {
  activity: Activity;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  return (
    <div className="flex items-start space-x-3 py-2">
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.user}</span>{' '}
          <span className="text-gray-600">{activity.action}</span>
        </p>
        {activity.details && (
          <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(activity.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// JIRA-style Comment Component
interface CommentProps {
  message: Message;
}

export const Comment: React.FC<CommentProps> = ({ message }) => {
  const initials = message.from.split(' ').map(n => n[0]).join('');
  const bgColor = message.role === 'IT' ? 'bg-blue-500' : message.role === 'OT' ? 'bg-green-500' : 'bg-gray-500';

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{message.from}</span>
          <span className="text-xs text-gray-500">{message.role}</span>
          <span className="text-xs text-gray-400">
            {new Date(message.timestamp).toLocaleString()}
          </span>
        </div>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</div>
        {message.issueFlagged && (
          <div className="mt-2 flex items-center space-x-1 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">Issue flagged</span>
          </div>
        )}
        {message.isResolution && (
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Resolution
          </div>
        )}
      </div>
    </div>
  );
};

// Kanban Column Component
interface KanbanColumnProps {
  title: string;
  count: number;
  children: React.ReactNode;
  color?: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  count,
  children,
  color = 'gray',
}) => {
  const colorStyles = {
    gray: 'bg-gray-100 border-gray-300',
    blue: 'bg-blue-50 border-blue-300',
    purple: 'bg-purple-50 border-purple-300',
    yellow: 'bg-yellow-50 border-yellow-300',
    green: 'bg-green-50 border-green-300',
    red: 'bg-red-50 border-red-300',
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className={`rounded-lg border-2 ${colorStyles[color as keyof typeof colorStyles] || colorStyles.gray} p-3 mb-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-xs font-medium text-gray-700">
            {count}
          </span>
        </div>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
        {children}
      </div>
    </div>
  );
};
