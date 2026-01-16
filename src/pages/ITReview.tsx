import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, MessageCircle, AlertCircle, X, Search, Filter, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

const ITReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests, updateRequest, currentUser } = useAppContext();

  const request = requests.find((r) => r.id === id);

  // Request Changes Modal State
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  // Reopen Request Modal State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Table filtering and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete' | 'flagged'>('all');

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found</p>
      </div>
    );
  }

  const handleViewConversation = () => {
    // In a real app, this would open a modal or navigate to conversation view
    alert('View full conversation history');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const handleApprove = () => {
    const now = new Date().toISOString();
    const newHistoryEntry = {
      id: 'history-' + Date.now(),
      status: 'complete' as const,
      timestamp: now,
      changedBy: currentUser.name,
      note: 'IT approved configuration and ready for export'
    };

    updateRequest(request.id, {
      status: 'complete',
      approvedAt: now,
      approvedBy: currentUser.name,
      statusHistory: [...(request.statusHistory || []), newHistoryEntry]
    });

    navigate(`/request/${id}/export`);
  };

  const handleRequestChanges = () => {
    if (!changeReason.trim()) {
      return; // Require a reason
    }

    const now = new Date().toISOString();
    const newHistoryEntry = {
      id: 'history-' + Date.now(),
      status: 'in-progress' as const,
      timestamp: now,
      changedBy: currentUser.name,
      reason: changeReason,
      note: `IT requested changes: ${changeReason}`
    };

    updateRequest(request.id, {
      status: 'in-progress',
      needsITInput: false, // Clear the flag since IT responded
      statusHistory: [...(request.statusHistory || []), newHistoryEntry]
    });

    // Reset modal state
    setShowChangesModal(false);
    setChangeReason('');

    navigate('/');
  };

  const handleUnblock = () => {
    const now = new Date().toISOString();
    const newHistoryEntry = {
      id: 'history-' + Date.now(),
      status: 'in-progress' as const,
      timestamp: now,
      changedBy: currentUser.name,
      note: 'IT resolved block - OT can continue'
    };

    updateRequest(request.id, {
      status: 'in-progress',
      blockInfo: undefined,
      needsITInput: false,
      statusHistory: [...(request.statusHistory || []), newHistoryEntry]
    });

    navigate('/');
  };

  const handleReopen = () => {
    if (!reopenReason.trim()) {
      return; // Require a reason
    }

    const now = new Date().toISOString();
    const newHistoryEntry = {
      id: 'history-' + Date.now(),
      status: 'in-progress' as const,
      timestamp: now,
      changedBy: currentUser.name,
      reason: reopenReason,
      note: `Request reopened by IT: ${reopenReason}`
    };

    updateRequest(request.id, {
      status: 'in-progress',
      approvedAt: undefined, // Clear approval metadata
      approvedBy: undefined,
      exportedAt: undefined, // Clear export metadata
      exportId: undefined,
      statusHistory: [...(request.statusHistory || []), newHistoryEntry]
    });

    // Reset modal state
    setShowReopenModal(false);
    setReopenReason('');

    navigate('/');
  };

  // Filter and search endpoints
  const filteredEndpoints = useMemo(() => {
    if (!request) return [];

    let filtered = request.endpoints;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ep => {
        const fieldCount = Object.keys(ep.fields).length;
        const filledCount = Object.values(ep.fields).filter(v => v && v.toString().trim()).length;
        const isComplete = ep.completed || (filledCount === fieldCount && fieldCount > 0);

        if (statusFilter === 'complete') return isComplete && !ep.issueFlagged;
        if (statusFilter === 'incomplete') return !isComplete;
        if (statusFilter === 'flagged') return ep.issueFlagged;
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ep => {
        // Search in all field values
        const fieldValues = Object.values(ep.fields).map(v => String(v).toLowerCase());
        const noteMatch = ep.issueDescription?.toLowerCase().includes(query);
        return fieldValues.some(v => v.includes(query)) || noteMatch;
      });
    }

    return filtered;
  }, [request, statusFilter, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to overview
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Response</h1>
            <p className="text-gray-600">
              {request.assignedTo} completed your request
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Summary</h2>

        {/* Machine */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Machine</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Asset ID:</span>{' '}
              <span className="text-gray-900 font-medium">{request.assetId}</span>
            </div>
            <div>
              <span className="text-gray-600">Name:</span>{' '}
              <span className="text-gray-900">{request.assetName}</span>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>{' '}
              <span className="text-gray-900">{request.location}</span>
            </div>
            <div>
              <span className="text-gray-600">Completed by:</span>{' '}
              <span className="text-gray-900">{request.assignedTo}</span>
            </div>
          </div>
        </div>

        {/* Connection */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-700">Connection</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Protocol:</span>{' '}
              <span className="text-gray-900">{request.connection?.protocol}</span>
            </div>
            <div>
              <span className="text-gray-600">Address:</span>{' '}
              <span className="text-gray-900">
                {request.connection?.host}:{request.connection?.port}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Authentication:</span>{' '}
              <span className="text-gray-900 capitalize">
                {request.connection?.authMethod?.replace('-', ' ') || 'Not specified'}
              </span>
            </div>
            {request.connection?.authReference && (
              <div className="col-span-2">
                <span className="text-gray-600">Auth Reference:</span>{' '}
                <span className="text-gray-900 font-mono text-xs">
                  {request.connection.authReference}
                </span>
                {request.connection?.authNote && (
                  <span className="text-gray-500 text-xs ml-2">
                    ({request.connection.authNote})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Endpoints - Excel-like Table View */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                Endpoints ({filteredEndpoints.length}{filteredEndpoints.length !== request.endpoints.length ? ` of ${request.endpoints.length}` : ''})
              </h3>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-gray-600">Complete</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-gray-600">Modified</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-gray-600">Incomplete</span>
              </div>
            </div>
          </div>

          {/* Table Controls: Search and Filter */}
          {request.endpoints.length > 0 && (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-3 space-y-3">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search endpoints by name, address, or any field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Filter:</span>
                </div>
                <div className="flex items-center space-x-2">
                  {(['all', 'complete', 'incomplete', 'flagged'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        statusFilter === filter
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {request.endpoints.length > 0 ? (
            filteredEndpoints.length > 0 ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap w-12">
                        #
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap w-16">
                        Status
                      </th>
                      {(() => {
                        // Get all unique field keys from all endpoints
                        const allKeys = new Set<string>();
                        request.endpoints.forEach(ep => {
                          Object.keys(ep.fields).forEach(key => allKeys.add(key));
                        });
                        const sortedKeys = Array.from(allKeys).sort((a, b) => {
                          // Put 'name' first if it exists
                          if (a === 'name') return -1;
                          if (b === 'name') return 1;
                          return a.localeCompare(b);
                        });
                        return sortedKeys.map(key => (
                          <th
                            key={key}
                            className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                          >
                            {key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())}
                          </th>
                        ));
                      })()}
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEndpoints.map((ep, index) => {
                      // Calculate completion status
                      const fieldCount = Object.keys(ep.fields).length;
                      const filledCount = Object.values(ep.fields).filter(v => v && v.toString().trim()).length;
                      const isComplete = ep.completed || (filledCount === fieldCount && fieldCount > 0);
                      const isPartial = filledCount > 0 && filledCount < fieldCount;

                      // Determine row background color
                      let rowClass = 'bg-white hover:bg-gray-50';
                      if (ep.issueFlagged) {
                        rowClass = 'bg-yellow-50 hover:bg-yellow-100';
                      } else if (isComplete) {
                        rowClass = 'bg-green-50 hover:bg-green-100';
                      } else if (isPartial) {
                        rowClass = 'bg-gray-50 hover:bg-gray-100';
                      }

                      // Get all unique field keys (same as header)
                      const allKeys = new Set<string>();
                      request.endpoints.forEach(ep => {
                        Object.keys(ep.fields).forEach(key => allKeys.add(key));
                      });
                      const sortedKeys = Array.from(allKeys).sort((a, b) => {
                        if (a === 'name') return -1;
                        if (b === 'name') return 1;
                        return a.localeCompare(b);
                      });

                      return (
                        <tr key={ep.id} className={rowClass}>
                          <td className="border border-gray-300 px-3 py-2 text-center text-gray-600 font-medium">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {ep.issueFlagged ? (
                              <span className="inline-flex items-center justify-center w-full">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                              </span>
                            ) : isComplete ? (
                              <span className="inline-flex items-center justify-center w-full">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-full text-xs text-gray-500">
                                {filledCount}/{fieldCount}
                              </span>
                            )}
                          </td>
                          {sortedKeys.map(key => (
                            <td
                              key={key}
                              className="border border-gray-300 px-3 py-2 text-gray-900"
                            >
                              {ep.fields[key] !== undefined && ep.fields[key] !== null && ep.fields[key] !== ''
                                ? ep.fields[key]
                                : <span className="text-gray-400 italic">-</span>
                              }
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-2 text-xs text-gray-700">
                            {ep.issueDescription || (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <p>No endpoints match your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )
          ) : (
            <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
              No endpoints configured yet
            </div>
          )}
        </div>

        {/* Validation */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Validation</h3>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">OT Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">All Fields Filled</span>
            </div>
            {request.conversation.length > 0 && (
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">{request.conversation.length} Messages</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Summary */}
      {request.conversation.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Discussion Summary</h2>
            <button
              onClick={handleViewConversation}
              className="text-sm text-blue-600 hover:underline"
            >
              View Full Conversation
            </button>
          </div>
          <div className="space-y-3">
            {request.conversation.slice(-3).map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded ${
                  msg.role === 'IT' ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{msg.from}</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Block Information */}
      {request.status === 'blocked' && request.blockInfo && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Request Blocked</h3>
              <p className="text-sm text-red-800 mb-3">
                <strong>Reason:</strong> {request.blockInfo.reason}
              </p>
              {request.blockInfo.alternativeOffered && request.blockInfo.alternativeDescription && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                  <p className="text-sm text-amber-900">
                    <strong>Alternative Offered:</strong> {request.blockInfo.alternativeDescription}
                  </p>
                </div>
              )}
              <p className="text-xs text-red-600">
                Blocked by {request.blockInfo.blockedBy} on {formatDate(request.blockInfo.blockedAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {request.status === 'blocked' ? (
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/request/${id}/respond`)}
            className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Discuss with OT
          </button>
          <button
            onClick={handleUnblock}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Resolve Block & Continue
          </button>
        </div>
      ) : request.status === 'review' ? (
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowChangesModal(true)}
            className="flex-1 px-6 py-3 text-orange-600 bg-white border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
          >
            Request Changes
          </button>
          <button
            onClick={handleApprove}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Approve & Export
          </button>
        </div>
      ) : request.status === 'complete' ? (
        <div>
          {/* Completion Badge */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Request Completed
                </p>
                <p className="text-xs text-green-700">
                  Approved by {request.approvedBy} on {formatDate(request.approvedAt || request.updatedAt)}
                  {request.exportedAt && ` • Exported on ${formatDate(request.exportedAt)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => setShowReopenModal(true)}
              className="flex-1 px-6 py-3 text-amber-600 bg-white border border-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Reopen Request
            </button>
            {!request.exportedAt && (
              <button
                onClick={() => navigate(`/request/${id}/export`)}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Export
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Request Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Request Changes</h2>
              <button
                onClick={() => setShowChangesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Explain what needs to be changed. OT will receive this feedback and can update the configuration.
                </p>
              </div>

              {/* Change Reason Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What needs to be changed? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g., Please use endpoint names that match our naming convention: {Machine}_{Location}_{DataType}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowChangesModal(false);
                  setChangeReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={!changeReason.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  changeReason.trim()
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send Changes Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Request Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-semibold text-gray-900">Reopen Request</h2>
              </div>
              <button
                onClick={() => setShowReopenModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Why reopen a completed request?</strong>
                  <br />
                  Use this when the export or downstream AI processing fails, or when you discover issues after approval.
                  The request will return to "In Progress" status for OT to make corrections.
                </p>
              </div>

              {/* Status History Indicator */}
              {request.statusHistory && request.statusHistory.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Previous completion:</strong> This request was approved by {request.approvedBy}
                    {request.approvedAt && ` on ${formatDate(request.approvedAt)}`}
                  </p>
                </div>
              )}

              {/* Reason Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reopening <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g., Export failed - CSV contains incorrect data types. Need OT to verify endpoint configurations."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Explain what went wrong and what needs to be fixed. This will be visible in the request's status history.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setReopenReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReopen}
                disabled={!reopenReason.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  reopenReason.trim()
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Reopen Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ITReview;
