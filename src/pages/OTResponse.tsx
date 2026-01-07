import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Send, AlertTriangle, CheckCircle, Plus, Trash2, Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Endpoint, Message, TemplateField } from '../types';
import StatusBadge from '../components/StatusBadge';

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
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  const [messageText, setMessageText] = useState('');
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueEndpointId, setIssueEndpointId] = useState<string>('');
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [hasStarted, setHasStarted] = useState(request?.status !== 'pending');

  useEffect(() => {
    if (request && request.endpoints.length > 0) {
      setLocalEndpoints(request.endpoints);
      setExpandedEndpoints(new Set(request.endpoints.map(ep => ep.id)));
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

  const handleFieldChange = (endpointId: string, fieldName: string, value: any) => {
    setLocalEndpoints((prev) =>
      prev.map((ep) => {
        if (ep.id === endpointId) {
          const newFields = { ...ep.fields, [fieldName]: value };
          const completion = getEndpointCompletion({ ...ep, fields: newFields });
          return {
            ...ep,
            fields: newFields,
            completed: completion.filled === completion.total,
          };
        }
        return ep;
      })
    );
  };

  const handleAddEndpoint = () => {
    const newEndpoint: Endpoint = {
      id: 'ep-' + Date.now(),
      fields: {},
      completed: false,
    };
    setLocalEndpoints([...localEndpoints, newEndpoint]);
    setExpandedEndpoints((prev) => new Set([...prev, newEndpoint.id]));
  };

  const handleRemoveEndpoint = (endpointId: string) => {
    if (localEndpoints.length > 1) {
      setLocalEndpoints(localEndpoints.filter((ep) => ep.id !== endpointId));
    }
  };

  const toggleExpanded = (endpointId: string) => {
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(endpointId)) {
        next.delete(endpointId);
      } else {
        next.add(endpointId);
      }
      return next;
    });
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

  const handleMarkIssue = (endpointId: string) => {
    setIssueEndpointId(endpointId);
    setIssueModalOpen(true);
  };

  const handleSubmitIssue = () => {
    if (issueType && issueDescription.trim()) {
      const updatedEndpoints = localEndpoints.map((ep) =>
        ep.id === issueEndpointId
          ? { ...ep, issueFlagged: true, issueDescription }
          : ep
      );
      setLocalEndpoints(updatedEndpoints);

      const issueMessage: Message = {
        id: 'msg-' + Date.now(),
        timestamp: new Date().toISOString(),
        from: currentUser.name,
        role: currentUser.role,
        message: `⚠️ Issue: ${issueDescription}`,
        issueFlagged: true,
      };
      addMessage(request.id, issueMessage);

      updateRequest(request.id, {
        status: 'blocked',
        endpoints: updatedEndpoints,
      });

      setIssueModalOpen(false);
      setIssueEndpointId('');
      setIssueType('');
      setIssueDescription('');
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

  const renderField = (field: TemplateField, endpointId: string, value: any) => {
    const commonClasses =
      'w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(endpointId, field.name, e.target.value)}
            className={commonClasses}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(endpointId, field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`${commonClasses} resize-none h-16`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(endpointId, field.name, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(endpointId, field.name, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1h ago';
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
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

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Left Panel - Configuration (60%) */}
        <div className="lg:col-span-3 space-y-6">
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

          {/* Data Points Section */}
          {protocol && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  DATA POINTS (map IT's needs to technical config)
                </h2>
              </div>

              {localEndpoints.map((endpoint, index) => {
                const isExpanded = expandedEndpoints.has(endpoint.id);
                const completion = getEndpointCompletion(endpoint);
                const name = endpoint.fields.name || `Data Point ${index + 1}`;

                return (
                  <div
                    key={endpoint.id}
                    className={`bg-white border rounded-lg overflow-hidden ${
                      endpoint.issueFlagged ? 'border-red-300' : 'border-gray-200'
                    }`}
                  >
                    {/* Header */}
                    <div
                      onClick={() => toggleExpanded(endpoint.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <button className="text-gray-600">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronUp className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <div className="font-medium text-gray-900">
                            {name}
                            {endpoint.issueFlagged && (
                              <span className="ml-2 text-red-600 text-sm">⚠️ BLOCKED</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {completion.filled}/{completion.total} fields
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {completion.filled === completion.total && completion.total > 0 ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className="text-sm text-gray-500">
                            {completion.total > 0 ? Math.round((completion.filled / completion.total) * 100) : 0}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 space-y-4">
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">From IT request:</span> Map this to technical configuration below
                        </div>

                        {template?.fieldGroups ? (
                          template.fieldGroups.map((group) => (
                            <div key={group.name}>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">{group.name}</h4>
                              <div className="grid grid-cols-1 gap-3">
                                {group.fields.map((field) => (
                                  <div key={field.name}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {field.label}
                                      {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {renderField(field, endpoint.id, endpoint.fields[field.name])}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {template?.fields?.map((field) => (
                              <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {renderField(field, endpoint.id, endpoint.fields[field.name])}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkIssue(endpoint.id);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Mark Issue
                          </button>
                          {localEndpoints.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEndpoint(endpoint.id);
                              }}
                              className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={handleAddEndpoint}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Data Point
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {protocol && (
            <div className="flex items-center space-x-4">
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
        </div>

        {/* Right Panel - Chat (40%) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg h-[calc(100vh-20rem)] flex flex-col sticky top-6">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Discussion with IT</h3>
              <p className="text-sm text-gray-500">{request.conversation.length} messages</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {request.conversation.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No messages yet. Ask a question if you need clarification!</p>
                </div>
              ) : (
                request.conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${
                      msg.role === 'IT' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    } border rounded-lg p-3`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-900">{msg.from}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            msg.role === 'IT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {msg.role}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                    {msg.issueFlagged && (
                      <div className="mt-2 flex items-center space-x-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs font-medium">Issue Reported</span>
                      </div>
                    )}
                    {msg.isResolution && (
                      <div className="mt-2 flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs font-medium">Resolution</span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
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
                  placeholder="Ask a question or provide clarification..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  rows={2}
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
      </div>

      {/* Issue Modal */}
      {issueModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's the issue?
                </label>
                <div className="space-y-2">
                  {[
                    "Requested data doesn't exist",
                    'Need more time to find information',
                    'Request is unclear',
                    'Need IT to clarify',
                  ].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={option}
                        checked={issueType === option}
                        onChange={(e) => setIssueType(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explain:</label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Provide details about the issue..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => {
                  setIssueModalOpen(false);
                  setIssueType('');
                  setIssueDescription('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIssue}
                disabled={!issueType || !issueDescription.trim()}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  issueType && issueDescription.trim()
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Mark Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTResponse;
