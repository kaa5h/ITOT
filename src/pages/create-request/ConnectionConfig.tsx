import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';

const ConnectionConfig: React.FC = () => {
  const navigate = useNavigate();
  const { templates } = useAppContext();
  const { selectedAsset, connection: savedConnection, setConnection, setTemplateId, setStep } = useRequestCreation();

  const activeTemplates = templates.filter((t) => t.status === 'active');

  const [protocol, setProtocol] = useState(savedConnection.protocol || '');
  const [host, setHost] = useState(savedConnection.host || '');
  const [port, setPort] = useState(savedConnection.port?.toString() || '502');
  const [otWillFill, setOtWillFill] = useState(false);

  const handleNext = () => {
    if (protocol && (otWillFill || (host && port))) {
      setConnection({
        protocol,
        host: otWillFill ? '' : host,
        port: otWillFill ? 0 : parseInt(port),
        otFilled: false,
      });
      const template = templates.find((t) => t.protocol === protocol);
      if (template) {
        setTemplateId(template.id);
      }
      setStep(3);
      navigate('/create-request/endpoints');
    }
  };

  const handlePrevious = () => {
    setStep(1);
    navigate('/create-request/asset');
  };

  if (!selectedAsset) {
    navigate('/create-request/asset');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
        <p className="text-gray-600">Step 2 of 4: Configure Connection</p>
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
            <div className="h-1 bg-gray-200 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Asset</span>
          <span className="font-medium text-blue-600">Connection</span>
          <span>Endpoints</span>
          <span>Review</span>
        </div>
      </div>

      {/* Asset Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Connection to: {selectedAsset.id}
        </h3>
        <p className="text-sm text-blue-700">{selectedAsset.name} - {selectedAsset.location}</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              These parameters are specified once and shared by all endpoints
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Connection details (host, port, protocol) apply to all data points you'll define in the next step.
            </p>
          </div>
        </div>
      </div>

      {/* Protocol Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Protocol <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Select the communication protocol for this machine
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => setProtocol(template.protocol)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                protocol === template.protocol
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-500">
                    {template.fieldGroups ? 'Complex Configuration' : 'Simple Configuration'}
                  </div>
                </div>
                {protocol === template.protocol && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Show one inactive as grayed out */}
          {templates.filter((t) => t.status === 'inactive').slice(0, 1).map((template) => (
            <div
              key={template.id}
              className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50 opacity-50 cursor-not-allowed"
            >
              <div className="font-medium text-gray-500">{template.name}</div>
              <div className="text-sm text-gray-400">Not available</div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Parameters */}
      {protocol && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Parameters</h2>

          {/* OT Will Fill Checkbox */}
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={otWillFill}
                onChange={(e) => setOtWillFill(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Leave blank - OT will fill connection details
              </span>
            </label>
          </div>

          {!otWillFill && (
            <div className="space-y-4">
              {/* Host */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="e.g., 502"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          className="inline-flex items-center px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!protocol || (!otWillFill && (!host || !port))}
          className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors ${
            protocol && (otWillFill || (host && port))
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ConnectionConfig;
