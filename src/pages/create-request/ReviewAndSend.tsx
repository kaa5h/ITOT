import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Mail, Bell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';
import { Request } from '../../types';

const ReviewAndSend: React.FC = () => {
  const navigate = useNavigate();
  const { addRequest, currentUser } = useAppContext();
  const { selectedAsset, description, timeline, estimatedDataPoints, resetState, setStep } = useRequestCreation();

  const [emailNotification, setEmailNotification] = useState(true);
  const [inAppNotification, setInAppNotification] = useState(true);

  if (!selectedAsset || !description.trim()) {
    navigate('/create-request/asset');
    return null;
  }

  const handlePrevious = () => {
    setStep(2);
    navigate('/create-request/describe');
  };

  const handleSend = () => {
    const now = new Date().toISOString();
    const newRequest: Request = {
      id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      location: selectedAsset.location,
      status: 'to-do',
      priority: 'Medium',
      createdBy: currentUser.name,
      assignedTo: selectedAsset.owner,
      createdAt: now,
      updatedAt: now,
      description,
      timeline,
      estimatedDataPoints,
      endpoints: [], // Empty - OT will fill
      conversation: [],
      activity: [],
      progressPercentage: 0,
      statusHistory: [{
        id: 'history-' + Date.now(),
        status: 'to-do',
        timestamp: now,
        changedBy: currentUser.name,
        note: 'Request created and sent to OT'
      }]
    };

    addRequest(newRequest);
    resetState();

    // Show success and redirect
    setTimeout(() => {
      navigate('/');
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
        <p className="text-gray-600">Step 3 of 3: Review & Send</p>
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
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Asset</span>
          <span>Describe Data</span>
          <span className="font-medium text-blue-600">Review</span>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Summary</h2>

        {/* Machine */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Machine</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Asset ID:</span>{' '}
              <span className="text-gray-900 font-medium">{selectedAsset.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Name:</span>{' '}
              <span className="text-gray-900">{selectedAsset.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>{' '}
              <span className="text-gray-900">{selectedAsset.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>{' '}
              <span className="text-gray-900">{selectedAsset.location}</span>
            </div>
          </div>
        </div>

        {/* What You're Requesting */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">What you're requesting:</h3>
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{description}</p>
          </div>
        </div>

        {/* Additional Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Estimated data points:</span>{' '}
              <span className="text-gray-900">{estimatedDataPoints}</span>
            </div>
            {timeline && (
              <div>
                <span className="text-gray-600">Timeline:</span>{' '}
                <span className="text-gray-900">{timeline}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-lg font-semibold text-green-900">Ready to Send</h2>
        </div>
        <div className="text-sm text-green-800">
          <p className="mb-2">
            This request will be assigned to: <span className="font-medium">{selectedAsset.owner}</span>
          </p>
          <p className="text-green-700">
            They will determine the protocol, configure connection details, and map your conceptual
            requirements to technical endpoint configurations.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>What happens next:</strong> OT personnel will review your requirements, determine which
          protocol this machine uses, configure the network connection, and translate your conceptual data
          needs into specific technical configurations. They may ask clarifying questions via the built-in
          chat if needed.
        </p>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotification}
              onChange={(e) => setEmailNotification(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Mail className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              Send email notification to {selectedAsset.owner}
            </span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={inAppNotification}
              onChange={(e) => setInAppNotification(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">Send in-app notification</span>
          </label>
        </div>
      </div>

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
          onClick={handleSend}
          className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Send Request
          <CheckCircle className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ReviewAndSend;
