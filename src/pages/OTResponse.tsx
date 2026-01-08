import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Endpoint, Message } from '../types';
import { StatusBadge, Comment } from '../components/JiraComponents';
import { DataPointGrid } from '../components/DataPointGrid';

const OTResponse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests, updateRequest, addMessage, currentUser, templates } = useAppContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const request = requests.find((r) => r.id === id);

  // OT Configuration State
  const [protocol, setProtocol] = useState(request?.connection?.protocol || '');
  const [host, setHost] = useState(request?.connection?.host || '');
  const [port, setPort] = useState(request?.connection?.port?.toString() || '502');
  const [machineId, setMachineId] = useState(request?.machineIdentifier || '');
  const [needNetworkIT, setNeedNetworkIT] = useState(false);

  const [localEndpoints, setLocalEndpoints] = useState<Endpoint[]>(request?.endpoints || []);
  const [messageText, setMessageText] = useState('');
  const [hasStarted, setHasStarted] = useState(request?.status !== 'pending');

  useEffect(() => {
    if (request && request.endpoints.length > 0) {
      setLocalEndpoints(request.endpoints);
    }
  }, [request]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [request?.conversation]);

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found</p>
      </div>
    );
  }

  const template = templates.find((t) => t.id === protocol || t.protocol === protocol);
  const activeTemplates = templates.filter(t => t.status === 'active');

  const allFields = template?.fieldGroups
    ? template.fieldGroups.flatMap((group) => group.fields)
    : template?.fields || [];

  const requiredFields = allFields.filter((f) => f.required);

  // Count required connection fields
  const connectionRequiredCount = 3; // protocol, host, port (machine ID is optional but recommended)
  const connectionFilledCount = [protocol, host, port].filter(v => v && v.trim()).length;

  const getEndpointCompletion = (endpoint: Endpoint) => {
    const filled = requiredFields.filter(
      (field) => endpoint.fields[field.name] && endpoint.fields[field.name].toString().trim() !== ''
    ).length;
    return { filled, total: requiredFields.length };
  };

  const getTotalCompletion = () => {
    const endpointTotal = requiredFields.length * localEndpoints.length;
    const endpointFilled = localEndpoints.reduce((sum, ep) => {
      return sum + getEndpointCompletion(ep).filled;
    }, 0);

    return {
      filled: connectionFilledCount + endpointFilled,
      total: connectionRequiredCount + endpointTotal,
    };
  };

  const totalCompletion = getTotalCompletion();
  const allComplete = totalCompletion.filled === totalCompletion.total && totalCompletion.total > 0 && protocol && host && port;

  const handleStartConfiguring = () => {
    setHasStarted(true);
    if (request.status === 'pending') {
      updateRequest(request.id, { status: 'in-progress' });
    }
  };


  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: 'msg-' + Date.now(),
        timestamp: new Date().toISOString(),
        from: currentUser.name,
        role: currentUser.role,
        message: messageText,
      };
      addMessage(request.id, newMessage);
      setMessageText('');

      if (request.status === 'pending' || request.status === 'in-progress') {
        updateRequest(request.id, { status: 'discussion-active' });
      }
    }
  };


  const handleSaveDraft = () => {
    const connection = {
      protocol,
      host,
      port: parseInt(port) || 502,
    };

    updateRequest(request.id, {
      connection,
      machineIdentifier: machineId,
      endpoints: localEndpoints,
      status: 'in-progress',
      progressPercentage: Math.round((totalCompletion.filled / totalCompletion.total) * 100),
    });
  };

  const handleSubmit = () => {
    if (allComplete) {
      const connection = {
        protocol,
        host,
        port: parseInt(port) || 502,
      };

      updateRequest(request.id, {
        connection,
        machineIdentifier: machineId,
        endpoints: localEndpoints,
        status: 'it-review',
        progressPercentage: 100,
      });

      navigate('/');
    }
  };


  // Initial pending view
  if (!hasStarted && request.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Integration Request from {request.createdBy}
          </h1>
          <p className="text-gray-600">
            {request.assetId} - {request.assetName}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">WHAT THEY NEED:</h2>
            <StatusBadge status={request.status} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
          </div>

          {request.timeline && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Timeline:</span>{' '}
              <span className="text-sm text-gray-900">{request.timeline}</span>
            </div>
          )}

          {request.estimatedDataPoints && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">Estimated data points:</span>{' '}
              <span className="text-sm text-gray-900">{request.estimatedDataPoints}</span>
            </div>
          )}

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Your Job:</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Determine which protocol this machine uses</li>
              <li>• Provide network connection details (host/port)</li>
              <li>• Map IT's conceptual needs to technical configuration</li>
              <li>• Define operation types (subscribe/read/write)</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              handleSendMessage();
              // Just open chat, don't start yet
            }}
            className="flex-1 px-6 py-3 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Ask Question First
          </button>
          <button
            onClick={handleStartConfiguring}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Configuring
          </button>
        </div>
      </div>
    );
  }

  // Main configuration view (split screen)
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Integration Request from {request.createdBy}
            </h1>
            <p className="text-gray-600">
              {request.assetId} - {request.assetName}
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* IT's Request Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">IT's Request:</h3>
        <p className="text-sm text-blue-800 whitespace-pre-wrap">{request.description}</p>
        {request.timeline && (
          <p className="text-sm text-blue-700 mt-2">
            <span className="font-medium">Timeline:</span> {request.timeline}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Progress: </span>
            <span className="text-sm font-medium text-gray-900">
              {totalCompletion.filled}/{totalCompletion.total} required fields complete
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {Array.from({ length: 8 }).map((_, i) => {
              const threshold = (i / 8) * totalCompletion.total;
              const filled = totalCompletion.filled > threshold;
              return (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${filled ? 'bg-blue-600' : 'bg-gray-300'}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="space-y-6 mb-6">
          {/* Connection Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">CONNECTION (you determine these)</h2>

            <div className="space-y-4">
              {/* Protocol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protocol <span className="text-red-500">*</span>
                </label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select protocol this machine uses...</option>
                  {activeTemplates.map((t) => (
                    <option key={t.id} value={t.protocol}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Based on what this machine uses</p>
              </div>

              {/* Host */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host/IP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Don't know? Mark "Need network IT" below</p>
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="e.g., 502"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Machine ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machine Identifier
                </label>
                <input
                  type="text"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  placeholder="Your internal ID for this machine"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Network IT Checkbox */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needNetworkIT}
                    onChange={(e) => setNeedNetworkIT(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Network information needed from IT network team
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Data Points Section - Excel Grid */}
          {protocol && (
            <DataPointGrid
              endpoints={localEndpoints}
              templateFields={allFields}
              onEndpointsChange={setLocalEndpoints}
            />
          )}

      </div>

      {/* Action Buttons */}
      {protocol && (
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={handleSaveDraft}
            className="flex-1 px-6 py-2 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allComplete}
            title={!allComplete ? `${totalCompletion.total - totalCompletion.filled} required fields remaining` : ''}
            className={`flex-1 px-6 py-2 rounded-lg transition-colors ${
              allComplete
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit to IT
          </button>
        </div>
      )}

      {/* Comments Section - Full Width Below */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Comments</h3>
          <p className="text-sm text-gray-500">{request.conversation.length} comments</p>
        </div>

        {/* Comments List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {request.conversation.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No comments yet. Ask a question if you need clarification!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {request.conversation.map((msg) => (
                <Comment key={msg.id} message={msg} />
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={3}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className={`p-2 rounded-lg transition-colors ${
                messageText.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OTResponse;
