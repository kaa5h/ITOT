import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MessageCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RequestStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';

const Dashboard: React.FC = () => {
  const { requests, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.assetId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

      const matchesAssignee =
        assigneeFilter === 'all' ||
        (assigneeFilter === 'me' &&
          (req.assignedTo === currentUser.name || req.createdBy === currentUser.name)) ||
        req.assignedTo === assigneeFilter;

      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [requests, searchQuery, statusFilter, assigneeFilter, currentUser]);

  // Group requests by status
  const groupedRequests = useMemo(() => {
    const groups: Record<string, typeof filteredRequests> = {
      'in-progress': [],
      'discussion-active': [],
      'blocked': [],
      'it-review': [],
      'pending': [],
      'complete': [],
    };

    filteredRequests.forEach((req) => {
      if (groups[req.status]) {
        groups[req.status].push(req);
      }
    });

    return groups;
  }, [filteredRequests]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = filteredRequests.length;
    const complete = filteredRequests.filter((r) => r.status === 'complete').length;
    const inProgress = filteredRequests.filter((r) => r.status === 'in-progress').length;
    const pending = filteredRequests.filter((r) => r.status === 'pending').length;
    const blocked = filteredRequests.filter((r) => r.status === 'blocked').length;

    return { total, complete, inProgress, pending, blocked };
  }, [filteredRequests]);

  const getRequestIcon = (status: RequestStatus) => {
    switch (status) {
      case 'discussion-active':
        return <MessageCircle className="w-5 h-5 text-yellow-600" />;
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleRequestClick = (requestId: string, status: RequestStatus) => {
    if (status === 'complete') {
      navigate(`/request/${requestId}/export`);
    } else if (status === 'it-review' && currentUser.role === 'IT') {
      navigate(`/request/${requestId}/review`);
    } else if (
      (status === 'pending' || status === 'in-progress' || status === 'discussion-active' || status === 'blocked') &&
      currentUser.role === 'OT'
    ) {
      navigate(`/request/${requestId}/respond`);
    } else {
      navigate(`/request/${requestId}/respond`);
    }
  };

  const renderRequestCard = (request: typeof requests[0]) => {
    const icon = getRequestIcon(request.status);

    return (
      <div
        key={request.id}
        onClick={() => handleRequestClick(request.id, request.status)}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <div>
              <h3 className="font-medium text-gray-900">{request.id}</h3>
              <p className="text-sm text-gray-600">{request.assetName}</p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Assigned:</span>
            <span className="text-gray-900">{request.assignedTo}</span>
          </div>

          {request.status !== 'complete' && request.status !== 'pending' && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Progress:</span>
              <ProgressBar
                current={request.progressPercentage || 0}
                total={100}
                showText={false}
              />
              <span className="text-gray-900">{request.progressPercentage || 0}%</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Last activity:</span>
            <span className="text-gray-900">{formatDate(request.updatedAt)}</span>
          </div>

          {request.status === 'blocked' && request.endpoints.some((ep) => ep.issueFlagged) && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-700">
                Issue: {request.endpoints.find((ep) => ep.issueFlagged)?.issueDescription}
              </p>
            </div>
          )}

          {request.status === 'discussion-active' && (
            <div className="mt-2 flex items-center space-x-1 text-yellow-700">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">Discussion active ({request.conversation.length} messages)</span>
            </div>
          )}

          {request.status === 'complete' && request.exportedAt && (
            <div className="mt-2 flex items-center space-x-1 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Exported on {formatDate(request.exportedAt)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRequestGroup = (status: RequestStatus, title: string) => {
    const groupRequests = groupedRequests[status];
    if (groupRequests.length === 0) return null;

    return (
      <div key={status} className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {title} ({groupRequests.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupRequests.map(renderRequestCard)}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage integration requests</p>
        </div>
        {(currentUser.role === 'IT' || currentUser.role === 'Admin') && (
          <Link
            to="/create-request/asset"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, asset name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | RequestStatus)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="discussion-active">Discussion Active</option>
                <option value="blocked">Blocked</option>
                <option value="it-review">IT Review</option>
                <option value="complete">Complete</option>
              </select>
            </div>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Assignees</option>
              <option value="me">My Requests</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">SUMMARY</h3>
        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-gray-600">Total: </span>
            <span className="font-medium text-gray-900">{stats.total}</span>
          </div>
          <div>
            <span className="text-gray-600">Complete: </span>
            <span className="font-medium text-green-700">
              {stats.complete} ({stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div>
            <span className="text-gray-600">In Progress: </span>
            <span className="font-medium text-blue-700">
              {stats.inProgress} ({stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div>
            <span className="text-gray-600">Pending: </span>
            <span className="font-medium text-gray-700">
              {stats.pending} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)
            </span>
          </div>
          {stats.blocked > 0 && (
            <div>
              <span className="text-gray-600">Blocked: </span>
              <span className="font-medium text-red-700">{stats.blocked}</span>
            </div>
          )}
        </div>
      </div>

      {/* Request Groups */}
      <div>
        {renderRequestGroup('in-progress', 'In Progress')}
        {renderRequestGroup('discussion-active', 'Discussion Active')}
        {renderRequestGroup('blocked', 'Blocked')}
        {renderRequestGroup('it-review', 'IT Review')}
        {renderRequestGroup('pending', 'Pending')}
        {renderRequestGroup('complete', 'Complete')}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No requests found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
