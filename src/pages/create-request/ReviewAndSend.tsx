import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';
import { Request } from '../../types';

const ReviewAndSend: React.FC = () => {
  const navigate = useNavigate();
  const { addRequest, currentUser, addEmail } = useAppContext();
  const { selectedAsset, description, resetState, setStep } = useRequestCreation();

  // Operations Settings (IT-defined, applies globally) - single select
  const [selectedOperation, setSelectedOperation] = useState<'subscribe' | 'read' | 'write'>('subscribe');

  // Email-based assignment
  const [recipientEmails, setRecipientEmails] = useState('');
  const [emailError, setEmailError] = useState('');


  if (!selectedAsset || !description.trim()) {
    navigate('/create-request/asset');
    return null;
  }

  const handlePrevious = () => {
    setStep(2);
    navigate('/create-request/describe');
  };


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSend = () => {
    // Validate email input
    if (!recipientEmails.trim()) {
      setEmailError('Please enter at least one email address');
      return;
    }

    // Parse and validate emails (comma-separated)
    const emailList = recipientEmails.split(',').map(e => e.trim()).filter(e => e);
    const invalidEmails = emailList.filter(e => !validateEmail(e));

    if (invalidEmails.length > 0) {
      setEmailError(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }

    setEmailError('');
    const now = new Date().toISOString();
    const requestId = 'REQ-' + Math.floor(1000 + Math.random() * 9000);
    const requestToken = 'TOKEN-' + Math.random().toString(36).substring(2, 15);
    const requestUrl = `/request/${requestId}/respond?token=${requestToken}`;

    const newRequest: Request = {
      id: requestId,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      location: selectedAsset.location,
      status: 'to-do',
      priority: 'Medium',
      createdBy: currentUser.name,
      assignedTo: 'Not assigned', // Will be assigned when claimed
      createdAt: now,
      updatedAt: now,
      description,
      // Email-based assignment
      recipientEmails: emailList,
      requestToken,
      requestUrl,
      // IT-defined operations (applies globally to all endpoints)
      operations: {
        subscribe: selectedOperation === 'subscribe',
        read: selectedOperation === 'read',
        write: selectedOperation === 'write',
      },
      endpoints: [], // Empty - OT will fill
      conversation: [],
      activity: [],
      progressPercentage: 0,
      statusHistory: [{
        id: 'history-' + Date.now(),
        status: 'to-do',
        timestamp: now,
        changedBy: currentUser.name,
        note: `Request created and sent to: ${emailList.join(', ')}`
      }]
    };

    addRequest(newRequest);

    // Send email to each recipient
    emailList.forEach(email => {
      addEmail({
        id: 'email-' + Date.now() + '-' + Math.random(),
        to: email,
        from: 'noreply@itot-tool.com',
        subject: `New Data Request: ${selectedAsset.name}`,
        body: `You have a new data request for ${selectedAsset.name}.\n\nRequest ID: ${requestId}\nMachine: ${selectedAsset.name}\nMQTT Topic: ${selectedAsset.location}\n\nClick to open request: ${requestUrl}`,
        timestamp: now,
        read: false,
        requestId,
        requestToken,
        emailType: 'request_sent'
      });
    });

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

      </div>

      {/* Operations Settings Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Operation Setting</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select which operation is allowed for this integration. This setting applies globally to all endpoints.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Operation Type <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value as 'subscribe' | 'read' | 'write')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="subscribe">Subscribe - Real-time data subscriptions (push notifications when values update)</option>
            <option value="read">Read - Read current values on demand (poll for current state)</option>
            <option value="write">Write - Write values to endpoints (control setpoints, commands, etc.)</option>
          </select>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> This operation applies to all endpoints in this request. OT does not need to specify operations per endpoint.
          </p>
        </div>
      </div>

      {/* Send Request To (Email) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Send Request To <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter the email address(es) of the OT personnel who should receive this request.
          You can enter one or multiple emails separated by commas.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            OT Email Address(es) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={recipientEmails}
            onChange={(e) => {
              setRecipientEmails(e.target.value);
              setEmailError('');
            }}
            placeholder="e.g., ot@company.com or ot1@company.com, ot2@company.com"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {emailError && (
            <p className="text-sm text-red-600 mt-1">{emailError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple emails with commas. Only format validation is performed - no ownership verification.
          </p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> The system will generate a unique, tokenized link and send it to the specified email(s).
            Anyone with the link can claim and work on this request.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>What happens next:</strong> An email with a unique link will be sent to the address(es) you provided.
          The first person to claim the request will be able to configure the protocol, connection details, and endpoints.
        </p>
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
