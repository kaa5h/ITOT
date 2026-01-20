import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Play, AlertCircle, X, Copy, Check, Link } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Endpoint, Message, TemplateField } from '../types';
import { StatusBadge, Comment } from '../components/JiraComponents';
import { DataPointGrid } from '../components/DataPointGrid';

const OTResponse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { requests, updateRequest, addMessage, currentUser, templates, addEmail, loggedInOTEmail, loginOT } = useAppContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const request = requests.find((r) => r.id === id);

  // Login overlay state
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pendingClaim, setPendingClaim] = useState(false); // Track if claim is pending after login

  // OT Configuration State
  const [protocol, setProtocol] = useState(request?.connection?.protocol || '');
  const [host, setHost] = useState(request?.connection?.host || '');
  const [port, setPort] = useState(request?.connection?.port?.toString() || '502');
  const [machineId, setMachineId] = useState(request?.machineIdentifier || '');
  const [needNetworkIT, setNeedNetworkIT] = useState(false);

  // Authentication State (references external secrets only)
  const [authMethod, setAuthMethod] = useState(request?.connection?.authMethod || 'none');
  const [authReference, setAuthReference] = useState(request?.connection?.authReference || '');
  const [authNote, setAuthNote] = useState(request?.connection?.authNote || '');

  const [localEndpoints, setLocalEndpoints] = useState<Endpoint[]>(request?.endpoints || []);
  const [customFields, setCustomFields] = useState<TemplateField[]>(request?.customFields || []);
  const [messageText, setMessageText] = useState('');
  const [hasStarted, setHasStarted] = useState(request?.status !== 'to-do');


  // Block Request Modal State
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [offerAlternative, setOfferAlternative] = useState(false);
  const [alternativeDescription, setAlternativeDescription] = useState('');

  // Shareable URL State
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    if (request && request.endpoints.length > 0) {
      setLocalEndpoints(request.endpoints);
    }
  }, [request]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [request?.conversation]);

  // Auto-claim when arriving from email link
  useEffect(() => {
    const token = searchParams.get('token');

    // Only auto-claim if:
    // 1. There's a token in URL (coming from email)
    // 2. Request exists and is to-do or pending
    // 3. User is not logged in
    if (token && request && !loggedInOTEmail) {
      const isUnclaimedOrPending = !request.claimedByEmail || request.claimedByEmail === 'pending';

      if (isUnclaimedOrPending && request.status === 'to-do') {
        console.log('[OTResponse] Auto-claiming from email link, token:', token);

        // Claim the request with pending status
        const now = new Date().toISOString();
        updateRequest(request.id, {
          status: 'in-progress',
          claimedByEmail: 'pending',
          claimedAt: now,
        });

        // Set states to show login overlay
        setPendingClaim(true);
        setHasStarted(true);
        setShowLoginOverlay(true);

        console.log('[OTResponse] Auto-claim complete, login overlay should show');
      }
    }
  }, [searchParams, request, loggedInOTEmail, updateRequest]);

  const handleLogin = () => {
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both email and password');
      return;
    }

    const success = loginOT(loginEmail, loginPassword);
    if (success) {
      console.log('[OTResponse] Login successful, closing overlay');

      // If claim was pending, complete it now with the real email
      if (pendingClaim && request) {
        console.log('[OTResponse] Completing pending claim');
        setPendingClaim(false);
        // Use loginEmail directly since state hasn't updated yet
        const email = loginEmail;
        const now = new Date().toISOString();
        const newHistoryEntry = {
          id: 'history-' + Date.now(),
          status: 'in-progress' as const,
          timestamp: now,
          changedBy: email,
          note: `Request claimed by ${email}`
        };

        updateRequest(request.id, {
          status: 'in-progress',
          claimedByEmail: email,
          claimedAt: now,
          assignedTo: email,
          statusHistory: [...(request.statusHistory || []), newHistoryEntry]
        });

        // Notify IT that request was claimed
        addEmail({
          id: 'email-' + Date.now() + '-it',
          to: request.createdBy,
          from: 'noreply@itot-tool.com',
          subject: `Request Claimed: ${request.assetName}`,
          body: `Request ${request.id} for ${request.assetName} has been claimed by ${email}.`,
          timestamp: now,
          read: false,
          requestId: request.id,
          emailType: 'claimed_notification'
        });
      }

      // Close overlay and clear form
      setShowLoginOverlay(false);
      setLoginEmail('');
      setLoginPassword('');
      console.log('[OTResponse] Overlay closed, login complete');
    } else {
      setLoginError('Invalid credentials. Use john.smith@company.com / 12345678');
    }
  };

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
    if (request.status === 'to-do') {
      const now = new Date().toISOString();
      const newHistoryEntry = {
        id: 'history-' + Date.now(),
        status: 'in-progress' as const,
        timestamp: now,
        changedBy: currentUser.name,
        note: 'Started working on configuration'
      };

      updateRequest(request.id, {
        status: 'in-progress',
        statusHistory: [...(request.statusHistory || []), newHistoryEntry]
      });
    }
  };

  // Function to handle direct claim (V10 flow)
  const handleDirectClaim = () => {
    console.log('[OTResponse] Direct claim initiated');
    console.log('[OTResponse] loggedInOTEmail:', loggedInOTEmail);
    console.log('[OTResponse] request.claimedByEmail:', request.claimedByEmail);

    // Check if already claimed by this user
    if (request.claimedByEmail === loggedInOTEmail) {
      console.log('[OTResponse] Already claimed by this user, just opening');
      // Already claimed by this user, just open the page
      setHasStarted(true);
      return;
    }

    // Check if user is logged in
    if (!loggedInOTEmail) {
      console.log('[OTResponse] Not logged in, claiming with pending and showing login overlay');
      // Not logged in - claim first, then show login overlay
      // We'll complete the claim flow after login
      setPendingClaim(true);

      // Claim the request immediately (using a placeholder until login completes)
      const now = new Date().toISOString();
      updateRequest(request.id, {
        status: 'in-progress',
        claimedByEmail: 'pending',
        claimedAt: now,
      });

      console.log('[OTResponse] Setting hasStarted=true and showLoginOverlay=true');
      setHasStarted(true);
      setShowLoginOverlay(true);
      return;
    }

    // User is logged in - claim directly
    performClaim(loggedInOTEmail);
  };

  // Function to perform the actual claim
  const performClaim = (email: string) => {
    const now = new Date().toISOString();
    const newHistoryEntry = {
      id: 'history-' + Date.now(),
      status: 'in-progress' as const,
      timestamp: now,
      changedBy: email,
      note: `Request claimed by ${email}`
    };

    // Claim the request immediately
    updateRequest(request.id, {
      status: 'in-progress',
      claimedByEmail: email,
      claimedAt: now,
      assignedTo: email,
      statusHistory: [...(request.statusHistory || []), newHistoryEntry]
    });

    // Notify IT that request was claimed
    addEmail({
      id: 'email-' + Date.now() + '-it',
      to: request.createdBy,
      from: 'noreply@itot-tool.com',
      subject: `Request Claimed: ${request.assetName}`,
      body: `Request ${request.id} for ${request.assetName} has been claimed by ${email}.`,
      timestamp: now,
      read: false,
      requestId: request.id,
      emailType: 'claimed_notification'
    });

    // Open request
    setHasStarted(true);
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
    }
  };


  const handleSaveDraft = () => {
    const connection = {
      protocol,
      host,
      port: parseInt(port) || 502,
      authMethod,
      authReference: authReference || undefined,
      authNote: authNote || undefined,
    };

    updateRequest(request.id, {
      connection,
      machineIdentifier: machineId,
      endpoints: localEndpoints,
      customFields: customFields.length > 0 ? customFields : undefined,
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
        authMethod,
        authReference: authReference || undefined,
        authNote: authNote || undefined,
      };

      const now = new Date().toISOString();
      const newHistoryEntry = {
        id: 'history-' + Date.now(),
        status: 'review' as const,
        timestamp: now,
        changedBy: currentUser.name,
        note: 'Submitted configuration for IT review'
      };

      updateRequest(request.id, {
        connection,
        machineIdentifier: machineId,
        endpoints: localEndpoints,
        customFields: customFields.length > 0 ? customFields : undefined,
        status: 'review',
        progressPercentage: 100,
        submittedAt: now,
        statusHistory: [...(request.statusHistory || []), newHistoryEntry]
      });

      navigate('/');
    }
  };

  const handleBlockRequest = () => {
    if (!blockReason.trim()) {
      return; // Require a reason
    }

    const now = new Date().toISOString();
    const blockInfo = {
      reason: blockReason,
      alternativeOffered: offerAlternative,
      alternativeDescription: offerAlternative ? alternativeDescription : undefined,
      blockedAt: now,
      blockedBy: currentUser.name
    };

    const newHistoryEntry = {
      id: 'history-' + Date.now(),
      status: 'blocked' as const,
      timestamp: now,
      changedBy: currentUser.name,
      reason: blockReason,
      note: offerAlternative ? `Blocked with alternative: ${alternativeDescription}` : 'Blocked - needs IT input'
    };

    updateRequest(request.id, {
      status: 'blocked',
      blockInfo,
      needsITInput: true,
      statusHistory: [...(request.statusHistory || []), newHistoryEntry]
    });

    // Reset modal state
    setShowBlockModal(false);
    setBlockReason('');
    setOfferAlternative(false);
    setAlternativeDescription('');

    navigate('/');
  };

  const handleCopyUrl = () => {
    const fullUrl = request.requestUrl
      ? `${window.location.origin}${request.requestUrl}`
      : window.location.href;
    navigator.clipboard.writeText(fullUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };


  // Check if request is unclaimed
  const isUnclaimed = !request.claimedByEmail;
  const isClaimedByOther = request.claimedByEmail &&
    request.claimedByEmail !== loggedInOTEmail &&
    request.claimedByEmail !== 'pending'; // Don't treat pending as claimed by other

  console.log('[OTResponse] Request ID:', request.id);
  console.log('[OTResponse] claimedByEmail:', request.claimedByEmail);
  console.log('[OTResponse] isUnclaimed:', isUnclaimed);
  console.log('[OTResponse] isClaimedByOther:', isClaimedByOther);
  console.log('[OTResponse] hasStarted:', hasStarted);
  console.log('[OTResponse] request.status:', request.status);
  console.log('[OTResponse] showLoginOverlay:', showLoginOverlay);
  console.log('[OTResponse] loggedInOTEmail:', loggedInOTEmail);


  // Initial to-do view
  if (!hasStarted && request.status === 'to-do') {
    // If claimed by someone else, show message
    if (isClaimedByOther) {
      return (
        <>
          <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Integration Request from {request.createdBy}
            </h1>
            <p className="text-gray-600">
              {request.assetId} - {request.assetName}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900">Request Already Claimed</h3>
                <p className="text-sm text-amber-800 mt-1">
                  This request is currently being handled by: <span className="font-medium">{request.claimedByEmail}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        </>
      );
    }

    return (
      <>
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
            </ul>
          </div>
        </div>

        {/* Shareable URL Display */}
        {request.requestUrl && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Link className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shareable URL</h2>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              This request can be accessed via the following unique link. Share this with other OT personnel if needed.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`${window.location.origin}${request.requestUrl}`}
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
          </div>
        )}

        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              handleSendMessage();
            }}
            className="flex-1 px-6 py-3 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Ask Question First
          </button>

          {isUnclaimed ? (
            <button
              onClick={handleDirectClaim}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-5 h-5 mr-2" />
              Claim Request
            </button>
          ) : (
            <button
              onClick={handleStartConfiguring}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Configuring
            </button>
          )}
        </div>
      </div>
      </>
    );
  }

  // Main configuration view (split screen)
  console.log('[OTResponse] Rendering main configuration view');
  console.log('[OTResponse] About to render login overlay, showLoginOverlay=', showLoginOverlay);

  return (
    <>
      {/* Login Overlay */}
      {showLoginOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div className="absolute inset-0 backdrop-blur-sm bg-gray-900/30"></div>

          {/* Login Modal */}
          <div className="relative z-10 bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Log in to work on this request</h2>
            <p className="text-sm text-gray-600 mb-6">
              Please enter your credentials to access this request
            </p>

            {/* Login Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="john.smith@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Log in
              </button>

              {/* Sign Up Button (non-functional, for demo) */}
              <button
                onClick={() => {}}
                className="w-full px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Sign up
              </button>
            </div>

            {/* Demo Hint */}
            <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Demo credentials:</strong>
                <br />
                Email: john.smith@company.com
                <br />
                Password: 12345678
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={showLoginOverlay ? 'blur-sm pointer-events-none' : ''}>
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

      {/* Validation Rules & Naming Convention */}
      {(request.validationRules?.length || request.namingConvention) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Data Entry Requirements
          </h3>

          {request.namingConvention && (
            <div className="mb-3">
              <p className="text-xs font-medium text-amber-800 mb-1">Naming Convention:</p>
              <code className="text-xs bg-amber-100 px-2 py-1 rounded text-amber-900">
                {request.namingConvention}
              </code>
            </div>
          )}

          {request.validationRules && request.validationRules.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-800 mb-2">
                Validation Rules ({request.validationRules.length}):
              </p>
              <div className="space-y-1">
                {request.validationRules.map((rule, index) => (
                  <div key={index} className="text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded">
                    <span className="font-medium">{rule.fieldName}:</span> {rule.errorMessage}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-amber-700 mt-3">
            ⚠️ Fields will be validated in real-time. Invalid entries will be highlighted with a red border.
          </p>
        </div>
      )}

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

              {/* Authentication Method */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None (Unsecured)</option>
                  <option value="certificate">Certificate (TLS/SSL)</option>
                  <option value="username-password">Username/Password</option>
                  <option value="api-key">API Key</option>
                  <option value="oauth">OAuth/Token</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">How does this machine authenticate connections?</p>
              </div>

              {/* Authentication Reference (conditional) */}
              {authMethod !== 'none' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secret Reference <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={authReference}
                      onChange={(e) => setAuthReference(e.target.value)}
                      placeholder={
                        authMethod === 'certificate' ? 'e.g., CN=prod-plc-01.company.com or vault/certs/plc-prod'
                        : authMethod === 'api-key' ? 'e.g., vault/api-keys/scada-system'
                        : 'e.g., vault/credentials/plc-accounts'
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Reference to where credentials are stored (Vault path, PKI cert CN, Key ID, etc.)
                      <br />
                      <span className="text-amber-600 font-medium">⚠️ Never enter actual passwords or secrets here</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Authentication Note (optional)
                    </label>
                    <input
                      type="text"
                      value={authNote}
                      onChange={(e) => setAuthNote(e.target.value)}
                      placeholder="e.g., Uses production PKI cert, auto-rotates monthly"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Additional context about the authentication setup</p>
                  </div>
                </>
              )}

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
              customFields={customFields}
              onCustomFieldsChange={setCustomFields}
              validationRules={request.validationRules}
              namingConvention={request.namingConvention}
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
            onClick={() => setShowBlockModal(true)}
            className="flex-1 inline-flex items-center justify-center px-6 py-2 text-red-600 bg-white border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Block Request
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

      {/* Block Request Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">Block Request</h2>
              </div>
              <button
                onClick={() => setShowBlockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Before blocking:</strong> Consider discussing the issue in comments first.
                  Only block if you cannot proceed without IT making a decision.
                </p>
              </div>

              {/* Reason Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for blocking <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Network firewall blocks this IP range. Cannot access PLC without network changes."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Explain why you cannot complete this request as specified
                </p>
              </div>

              {/* Alternative Checkbox */}
              <div>
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerAlternative}
                    onChange={(e) => setOfferAlternative(e.target.checked)}
                    className="w-4 h-4 mt-1 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      I can offer an alternative approach
                    </span>
                    <p className="text-xs text-gray-500">
                      If there's a different way to get the data IT needs, describe it below
                    </p>
                  </div>
                </label>
              </div>

              {/* Alternative Description (conditional) */}
              {offerAlternative && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative approach
                  </label>
                  <textarea
                    value={alternativeDescription}
                    onChange={(e) => setAlternativeDescription(e.target.value)}
                    placeholder="e.g., I cannot use Modbus TCP, but this PLC also supports OPC UA on port 4840. Would that work?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                  setOfferAlternative(false);
                  setAlternativeDescription('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockRequest}
                disabled={!blockReason.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  blockReason.trim()
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Block Request
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default OTResponse;
