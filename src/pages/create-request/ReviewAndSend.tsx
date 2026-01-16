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

  // Assignment section
  const [assignmentMethod, setAssignmentMethod] = useState<'url' | 'email'>('email');
  const [otEmail, setOtEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [inviteSent, setInviteSent] = useState(false);


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

  const handleSendInvite = () => {
    // Validate email input (only for email method)
    if (assignmentMethod === 'email') {
      if (!otEmail.trim()) {
        setEmailError('Please enter OT email address');
        return;
      }

      if (!validateEmail(otEmail)) {
        setEmailError('Invalid email format');
        return;
      }
      setEmailError('');
    }

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
      assignedTo: otEmail, // Assigned to the email entered
      createdAt: now,
      updatedAt: now,
      description,
      // Email-based assignment
      recipientEmails: assignmentMethod === 'email' ? [otEmail] : [],
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
        note: `Request created and assigned to: ${otEmail}`
      }]
    };

    addRequest(newRequest);

    // Send email invite (only if email method)
    if (assignmentMethod === 'email') {
      addEmail({
        id: 'email-' + Date.now(),
        to: otEmail,
        from: 'noreply@itot-tool.com',
        subject: 'New IT request needs OT input',
        body: `You have been assigned a new IT request that requires your input.\n\nRequest ID: ${requestId}\nMachine: ${selectedAsset.name}\nMQTT Topic: ${selectedAsset.location}\n\nPlease log in to work on this request: ${window.location.origin}${requestUrl}`,
        timestamp: now,
        read: false,
        requestId,
        requestToken,
        emailType: 'request_sent'
      });

      // Show invite sent confirmation
      setInviteSent(true);
      setTimeout(() => {
        setInviteSent(false);
        resetState();
        navigate('/');
      }, 2000);
    }
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

      {/* Assign OT Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Assign OT <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose how to assign this request to OT personnel.
        </p>

        {/* Option Buttons */}
        <div className="mb-6 space-y-3">
          {/* Option 1: Get Shareable URL (Placeholder) */}
          <div
            className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 opacity-60 cursor-not-allowed"
            title="This option is not yet available"
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                name="assignmentMethod"
                value="url"
                disabled
                className="cursor-not-allowed"
              />
              <div>
                <p className="text-sm font-medium text-gray-500">Get shareable URL</p>
                <p className="text-xs text-gray-400">Coming soon - not yet implemented</p>
              </div>
            </div>
          </div>

          {/* Option 2: Send Invite via Email (Functional) */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              assignmentMethod === 'email'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-400'
            }`}
            onClick={() => setAssignmentMethod('email')}
          >
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="radio"
                name="assignmentMethod"
                value="email"
                checked={assignmentMethod === 'email'}
                onChange={() => setAssignmentMethod('email')}
                className="cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Send invite via email</p>
                <p className="text-xs text-gray-600">Invite OT personnel by email address</p>
              </div>
            </div>

            {assignmentMethod === 'email' && (
              <div className="ml-6 mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    OT Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={otEmail}
                    onChange={(e) => {
                      setOtEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="e.g., john.smith@company.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {emailError && (
                    <p className="text-sm text-red-600 mt-1">{emailError}</p>
                  )}
                </div>

                <button
                  onClick={handleSendInvite}
                  disabled={inviteSent}
                  className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors font-medium ${
                    inviteSent
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {inviteSent ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Invite Sent!
                    </>
                  ) : (
                    <>
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
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
      </div>
    </div>
  );
};

export default ReviewAndSend;
