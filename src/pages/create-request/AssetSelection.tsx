import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';
import { Asset } from '../../types';

const AssetSelection: React.FC = () => {
  const navigate = useNavigate();
  const { users } = useAppContext();
  const { setSelectedAsset, setStep } = useRequestCreation();

  // Filter OT users
  const otUsers = users.filter(user => user.role === 'OT');

  // State for MQTT topic and machine name
  const [mqttTopic, setMqttTopic] = useState('');
  const [machineName, setMachineName] = useState('');
  const [assignedTo, setAssignedTo] = useState(otUsers[0]?.name || '');

  const handleNext = () => {
    if (!mqttTopic.trim() || !machineName.trim() || !assignedTo) {
      return;
    }

    // Create a pseudo asset from the manual input
    const assetId = `MANUAL-${Date.now()}`;

    const manualAsset: Asset = {
      id: assetId,
      name: machineName,
      type: 'Manual Entry',
      location: mqttTopic,
      company: mqttTopic.split('/')[0] || '',
      plant: mqttTopic.split('/')[1] || '',
      shop: mqttTopic.split('/')[2] || '',
      line: mqttTopic.split('/')[3] || '',
      station: mqttTopic.split('/')[4] || '',
      owner: assignedTo,
    };

    setSelectedAsset(manualAsset);
    setStep(2);
    navigate('/create-request/describe');
  };

  const canProceed = mqttTopic.trim() && machineName.trim() && assignedTo;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
        <p className="text-gray-600">Step 1 of 3: Specify Machine</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
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
          <span className="font-medium text-blue-600">Machine</span>
          <span>Describe Data</span>
          <span>Review</span>
        </div>
      </div>

      {/* Manual Input Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Machine Information</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter the MQTT topic path and machine name for this data request.
        </p>

        <div className="space-y-4">
          {/* MQTT Topic Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MQTT Topic Path <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={mqttTopic}
              onChange={(e) => setMqttTopic(e.target.value)}
              placeholder="e.g., company/site/line/machine or acme/plant1/line5/welder3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste the existing MQTT root topic for this machine
            </p>
          </div>

          {/* Machine Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              placeholder="e.g., Welder 3, CNC Mill 5, Assembly Robot 2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assign To Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To <span className="text-red-500">*</span>
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {otUsers.map(user => (
                <option key={user.id} value={user.name}>
                  {user.name}{user.site ? ` - ${user.site}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select which OT person will handle this request
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {(mqttTopic || machineName || assignedTo) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Preview</h3>
          <div className="space-y-1 text-sm">
            {machineName && (
              <div>
                <span className="text-blue-700">Machine: </span>
                <span className="text-blue-900 font-medium">{machineName}</span>
              </div>
            )}
            {mqttTopic && (
              <div>
                <span className="text-blue-700">MQTT Topic: </span>
                <span className="text-blue-900 font-mono">{mqttTopic}</span>
              </div>
            )}
            {assignedTo && (
              <div>
                <span className="text-blue-700">Assigned To: </span>
                <span className="text-blue-900 font-medium">{assignedTo}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> This tool assumes your organization already has an MQTT topic strategy in place.
          Simply paste the existing topic path for the machine you need data from.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors ${
            canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next: Describe Data
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default AssetSelection;
