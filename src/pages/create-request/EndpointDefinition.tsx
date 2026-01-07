import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';
import { Endpoint, TemplateField } from "../../types";

const EndpointDefinition: React.FC = () => {
  const navigate = useNavigate();
  const { templates } = useAppContext();
  const {
    selectedAsset,
    connection,
    templateId,
    endpoints: savedEndpoints,
    setEndpoints,
    setStep,
  } = useRequestCreation();

  const template = templates.find((t) => t.id === templateId);
  const [endpoints, setLocalEndpoints] = useState<Endpoint[]>(
    savedEndpoints.length > 0
      ? savedEndpoints
      : [{ id: 'ep-' + Date.now(), fields: {}, completed: false }]
  );
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(
    new Set(endpoints.map((ep) => ep.id))
  );
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(
    template?.fieldGroups ? 'cards' : 'table'
  );

  useEffect(() => {
    // Auto-determine view mode based on template
    if (template?.fieldGroups) {
      setViewMode('cards');
    } else {
      setViewMode('table');
    }
  }, [template]);

  if (!selectedAsset || !connection || !template) {
    navigate('/create-request/asset');
    return null;
  }

  const allFields = template.fieldGroups
    ? template.fieldGroups.flatMap((group) => group.fields)
    : template.fields || [];

  const requiredFields = allFields.filter((f) => f.required);

  const getEndpointCompletion = (endpoint: Endpoint) => {
    const filled = requiredFields.filter(
      (field) => endpoint.fields[field.name] && endpoint.fields[field.name].toString().trim() !== ''
    ).length;
    return { filled, total: requiredFields.length };
  };

  const getTotalCompletion = () => {
    const total = requiredFields.length * endpoints.length;
    const filled = endpoints.reduce((sum, ep) => {
      return sum + getEndpointCompletion(ep).filled;
    }, 0);
    return { filled, total };
  };

  const totalCompletion = getTotalCompletion();
  const allComplete = totalCompletion.filled === totalCompletion.total && totalCompletion.total > 0;

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
    setLocalEndpoints([...endpoints, newEndpoint]);
    setExpandedEndpoints((prev) => new Set([...prev, newEndpoint.id]));
  };

  const handleRemoveEndpoint = (endpointId: string) => {
    if (endpoints.length > 1) {
      setLocalEndpoints(endpoints.filter((ep) => ep.id !== endpointId));
      setExpandedEndpoints((prev) => {
        const next = new Set(prev);
        next.delete(endpointId);
        return next;
      });
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

  const renderField = (field: TemplateField, endpointId: string, value: any) => {
    const commonClasses =
      'w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';

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
            className={`${commonClasses} resize-none h-20`}
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

  const renderTableView = () => {
    const fields = template.fields || [];
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  #
                </th>
                {fields.map((field) => (
                  <th
                    key={field.name}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </th>
                ))}
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {endpoints.map((endpoint, index) => (
                <tr key={endpoint.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                  {fields.map((field) => (
                    <td key={field.name} className="px-3 py-2">
                      {renderField(field, endpoint.id, endpoint.fields[field.name])}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {endpoints.length > 1 && (
                      <button
                        onClick={() => handleRemoveEndpoint(endpoint.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleAddEndpoint}
            className="inline-flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </button>
        </div>
      </div>
    );
  };

  const renderCardView = () => {
    return (
      <div className="space-y-4">
        {endpoints.map((endpoint, index) => {
          const isExpanded = expandedEndpoints.has(endpoint.id);
          const completion = getEndpointCompletion(endpoint);
          const name = endpoint.fields.name || `Endpoint ${index + 1}`;

          return (
            <div key={endpoint.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                    <div className="font-medium text-gray-900">{name}</div>
                    <div className="text-sm text-gray-500">
                      {completion.filled}/{completion.total} fields
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {completion.filled === completion.total && completion.total > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Complete
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {Math.round((completion.filled / completion.total) * 100)}%
                    </span>
                  )}
                  {endpoints.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEndpoint(endpoint.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-6">
                  {template.fieldGroups?.map((group) => (
                    <div key={group.name}>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">{group.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.fields.map((field) => (
                          <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {renderField(field, endpoint.id, endpoint.fields[field.name])}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={handleAddEndpoint}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Add Endpoint
        </button>
      </div>
    );
  };

  const handleNext = () => {
    if (allComplete) {
      setEndpoints(endpoints);
      setStep(4);
      navigate('/create-request/review');
    }
  };

  const handlePrevious = () => {
    setEndpoints(endpoints);
    setStep(2);
    navigate('/create-request/connection');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
        <p className="text-gray-600">Step 3 of 4: Define Endpoints</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className="flex-1">
            <div className="h-1 bg-blue-600 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-blue-600 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-blue-600 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Asset</span>
          <span>Connection</span>
          <span className="font-medium text-blue-600">Endpoints</span>
          <span>Review</span>
        </div>
      </div>

      {/* Connection Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900">
              Connection: {connection.host ? `${connection.host}:${connection.port}` : 'To be filled by OT'} ({template.name})
            </h3>
            <p className="text-xs text-blue-700">Machine: {selectedAsset.id} - {selectedAsset.name}</p>
          </div>
        </div>
      </div>

      {/* Progress Tracking */}
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

      {/* View Toggle */}
      {template.fieldGroups && (
        <div className="mb-4">
          <div className="inline-flex items-center space-x-2 text-sm">
            <span className="text-gray-600">VIEW:</span>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded ${
                viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Expandable Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Compact Table
            </button>
          </div>
        </div>
      )}

      {/* Endpoints */}
      <div className="mb-6">{viewMode === 'table' || !template.fieldGroups ? renderTableView() : renderCardView()}</div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          className="inline-flex items-center px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </button>
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevious}
            className="px-6 py-2 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={handleNext}
            disabled={!allComplete}
            title={!allComplete ? `${totalCompletion.total - totalCompletion.filled} required fields remaining` : ''}
            className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors ${
              allComplete
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndpointDefinition;
