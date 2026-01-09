import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, MessageCircle, AlertCircle, X } from 'lucide-react';
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

  return (
    <div className="max-w-4xl mx-auto">
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
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-700">Endpoints</h3>
          </div>
          <div className="space-y-3">
            {request.endpoints.map((ep, index) => (
              <div
                key={ep.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {ep.fields.name || `Endpoint ${index + 1}`}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      {Object.entries(ep.fields).slice(1, 5).map(([key, value]) => (
                        <div key={key}>
                          <span className="capitalize">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                  {ep.issueFlagged ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                      Modified
                    </span>
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                {ep.issueFlagged && ep.issueDescription && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <span className="font-medium">Note:</span> {ep.issueDescription}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
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

    </div>
  );
};

export default ITReview;
