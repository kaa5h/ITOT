import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RequestStatus } from '../types';
import { PriorityBadge, StatusBadge } from '../components/JiraComponents';

const Dashboard: React.FC = () => {
  const { requests, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requests, searchQuery, statusFilter, priorityFilter]);

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

  const toggleSelectAll = () => {
    if (selectedRequests.size === filteredRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
          </p>
        </div>
        {(currentUser.role === 'IT' || currentUser.role === 'Admin') && (
          <Link
            to="/create-request/asset"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create a request
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <div className="p-4 flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | RequestStatus)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="discussion-active">Discussion</option>
              <option value="blocked">Blocked</option>
              <option value="it-review">Review</option>
              <option value="complete">Done</option>
            </select>

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

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Protocol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Data Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Assigned to
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                    No requests found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRequestClick(req.id, req.status)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(req.id)}
                        onChange={() => toggleSelect(req.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.id}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{req.assetName}</div>
                      <div className="text-xs text-gray-500">{req.assetId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700 max-w-xs truncate">{req.location}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {req.connection?.protocol ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {req.connection.protocol === 'modbus-tcp' ? 'Modbus' :
                             req.connection.protocol === 'opc-ua' ? 'OPC UA' :
                             req.connection.protocol === 'mqtt' ? 'MQTT' :
                             req.connection.protocol}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {req.endpoints.length > 0 ? req.endpoints.length : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {getInitials(req.assignedTo)}
                        </div>
                        <span className="text-sm text-gray-900">{req.assignedTo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatTime(req.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRequestClick(req.id, req.status)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {req.status === 'complete' ? 'View' :
                           req.status === 'it-review' && currentUser.role === 'IT' ? 'Review' :
                           'Open'}
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      {filteredRequests.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredRequests.length} of {requests.length} requests
        </div>
      )}
    </div>
  );
};

export default Dashboard;
