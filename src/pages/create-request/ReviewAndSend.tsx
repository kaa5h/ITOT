import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Copy, Check } from 'lucide-react';
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
  const [assignmentMethod, setAssignmentMethod] = useState<'email' | 'url'>('email');
  const [recipientEmails, setRecipientEmails] = useState('');
  const [emailError, setEmailError] = useState('');
  const [shareableUrl, setShareableUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);


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

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareableUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // Generate shareable URL when URL mode is selected
  useEffect(() => {
    if (assignmentMethod === 'url' && !shareableUrl) {
      const requestId = 'REQ-' + Math.floor(1000 + Math.random() * 9000);
      const requestToken = 'TOKEN-' + Math.random().toString(36).substring(2, 15);
      const requestUrl = `/request/${requestId}/respond?token=${requestToken}`;
      const fullUrl = `${window.location.origin}${requestUrl}`;
      setShareableUrl(fullUrl);
    }
  }, [assignmentMethod, shareableUrl]);

  const handleSend = () => {
    let emailList: string[] = [];

    // Validate email input only if using email method
    if (assignmentMethod === 'email') {
      if (!recipientEmails.trim()) {
        setEmailError('Please enter at least one email address');
        return;
      }

      // Parse and validate emails (comma-separated)
      emailList = recipientEmails.split(',').map(e => e.trim()).filter(e => e);
      const invalidEmails = emailList.filter(e => !validateEmail(e));

      if (invalidEmails.length > 0) {
        setEmailError(`Invalid email format: ${invalidEmails.join(', ')}`);
        return;
      }
      setEmailError('');
    }

    const now = new Date().toISOString();
    const requestId = 'REQ-' + Math.floor(1000 + Math.random() * 9000);
    const requestToken = 'TOKEN-' + Math.random().toString(36).substring(2, 15);
    const requestUrl = `/request/${requestId}/respond?token=${requestToken}`;

    const statusNote = assignmentMethod === 'email'
      ? `Request created and sent to: ${emailList.join(', ')}`
      : 'Request created with shareable URL';

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
      recipientEmails: assignmentMethod === 'email' ? emailList : [],
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
        note: statusNote
      }]
    };

    addRequest(newRequest);

    // Send email to each recipient only if using email method
    if (assignmentMethod === 'email') {
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
    }

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

      {/* Assignment Method */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Assignment Method <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose how you want to assign this request to OT personnel.
        </p>

        {/* Toggle Buttons */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setAssignmentMethod('email')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                assignmentMethod === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Send via Email
            </button>
            <button
              type="button"
              onClick={() => setAssignmentMethod('url')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-l border-gray-300 ${
                assignmentMethod === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Get Shareable URL
            </button>
          </div>
        </div>

        {/* Conditional Content: Email Input */}
        {assignmentMethod === 'email' && (
          <>
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
          </>
        )}

        {/* Conditional Content: Shareable URL */}
        {assignmentMethod === 'url' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Shareable URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareableUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {urlCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Copy this URL and share it with OT personnel via your preferred communication channel.
              </p>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-800">
                <strong>Note:</strong> Anyone with this URL can claim and work on this request.
                Share it only with authorized OT personnel.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>What happens next:</strong> {assignmentMethod === 'email'
            ? 'An email with a unique link will be sent to the address(es) you provided.'
            : 'Share the URL with OT personnel. Anyone with the link can claim the request.'}
          {' '}The first person to claim the request will be able to configure the protocol, connection details, and endpoints.
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
