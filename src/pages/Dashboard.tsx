import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RequestStatus } from '../types';
import { IssueCard, KanbanColumn, PriorityBadge, StatusBadge } from '../components/JiraComponents';

const Dashboard: React.FC = () => {
  const { requests, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [requests, searchQuery, priorityFilter]);

  // Group requests by status for Kanban board
  const kanbanGroups = useMemo(() => {
    const groups = {
      pending: filteredRequests.filter(r => r.status === 'pending'),
      'in-progress': filteredRequests.filter(r => r.status === 'in-progress'),
      'discussion-active': filteredRequests.filter(r => r.status === 'discussion-active'),
      blocked: filteredRequests.filter(r => r.status === 'blocked'),
      'it-review': filteredRequests.filter(r => r.status === 'it-review'),
      complete: filteredRequests.filter(r => r.status === 'complete'),
    };
    return groups;
  }, [filteredRequests]);

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

  const renderKanbanBoard = () => {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4">
        <KanbanColumn title="To Do" count={kanbanGroups.pending.length} color="gray">
          {kanbanGroups.pending.map(req => (
            <IssueCard
              key={req.id}
              id={req.id}
              assetName={req.assetName}
              description={req.description}
              priority={req.priority}
              assignedTo={req.assignedTo}
              createdBy={req.createdBy}
              onClick={() => handleRequestClick(req.id, req.status)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title="In Progress" count={kanbanGroups['in-progress'].length} color="blue">
          {kanbanGroups['in-progress'].map(req => (
            <IssueCard
              key={req.id}
              id={req.id}
              assetName={req.assetName}
              description={req.description}
              priority={req.priority}
              assignedTo={req.assignedTo}
              createdBy={req.createdBy}
              onClick={() => handleRequestClick(req.id, req.status)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title="Discussion" count={kanbanGroups['discussion-active'].length} color="purple">
          {kanbanGroups['discussion-active'].map(req => (
            <IssueCard
              key={req.id}
              id={req.id}
              assetName={req.assetName}
              description={req.description}
              priority={req.priority}
              assignedTo={req.assignedTo}
              createdBy={req.createdBy}
              onClick={() => handleRequestClick(req.id, req.status)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title="Blocked" count={kanbanGroups.blocked.length} color="red">
          {kanbanGroups.blocked.map(req => (
            <IssueCard
              key={req.id}
              id={req.id}
              assetName={req.assetName}
              description={req.description}
              priority={req.priority}
              assignedTo={req.assignedTo}
              createdBy={req.createdBy}
              onClick={() => handleRequestClick(req.id, req.status)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title="Review" count={kanbanGroups['it-review'].length} color="yellow">
          {kanbanGroups['it-review'].map(req => (
            <IssueCard
              key={req.id}
              id={req.id}
              assetName={req.assetName}
              description={req.description}
              priority={req.priority}
              assignedTo={req.assignedTo}
              createdBy={req.createdBy}
              onClick={() => handleRequestClick(req.id, req.status)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn title="Done" count={kanbanGroups.complete.length} color="green">
          {kanbanGroups.complete.map(req => (
            <IssueCard
              key={req.id}
              id={req.id}
              assetName={req.assetName}
              description={req.description}
              priority={req.priority}
              assignedTo={req.assignedTo}
              createdBy={req.createdBy}
              onClick={() => handleRequestClick(req.id, req.status)}
            />
          ))}
        </KanbanColumn>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.map(req => (
              <tr
                key={req.id}
                onClick={() => handleRequestClick(req.id, req.status)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{req.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{req.assetName}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">{req.description}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <PriorityBadge priority={req.priority} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{req.assignedTo}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{req.createdBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No requests found matching your filters.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'issue' : 'issues'}
          </p>
        </div>
        {(currentUser.role === 'IT' || currentUser.role === 'Admin') && (
          <Link
            to="/create-request/asset"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Issue
          </Link>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'board' ? renderKanbanBoard() : renderListView()}
      </div>
    </div>
  );
};

export default Dashboard;
