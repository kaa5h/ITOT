import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Mail, Bell, Plus, X, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';
import { Request, ValidationRule } from '../../types';

const ReviewAndSend: React.FC = () => {
  const navigate = useNavigate();
  const { addRequest, currentUser } = useAppContext();
  const { selectedAsset, description, timeline, estimatedDataPoints, resetState, setStep } = useRequestCreation();

  const [emailNotification, setEmailNotification] = useState(true);
  const [inAppNotification, setInAppNotification] = useState(true);

  // Operations Settings (IT-defined, applies globally)
  const [opSubscribe, setOpSubscribe] = useState(true);
  const [opRead, setOpRead] = useState(true);
  const [opWrite, setOpWrite] = useState(false);

  // Naming Convention (IT-defined, enforced for OT)
  const [namingConvention, setNamingConvention] = useState('{Asset}_{Parameter}_{Unit}');

  // Validation Rules (IT-defined, enforced for OT)
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleFieldName, setNewRuleFieldName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'regex' | 'format' | 'enum' | 'range'>('regex');
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleErrorMessage, setNewRuleErrorMessage] = useState('');

  if (!selectedAsset || !description.trim()) {
    navigate('/create-request/asset');
    return null;
  }

  const handlePrevious = () => {
    setStep(2);
    navigate('/create-request/describe');
  };

  const handleAddValidationRule = () => {
    if (!newRuleFieldName.trim() || !newRuleValue.trim() || !newRuleErrorMessage.trim()) {
      return;
    }

    let processedValue: string | string[] | { min?: number; max?: number };

    if (newRuleType === 'enum') {
      // Split by comma for enum values
      processedValue = newRuleValue.split(',').map(v => v.trim()).filter(v => v);
    } else if (newRuleType === 'range') {
      // Parse as min/max range
      const [min, max] = newRuleValue.split(',').map(v => parseFloat(v.trim()));
      processedValue = { min: isNaN(min) ? undefined : min, max: isNaN(max) ? undefined : max };
    } else {
      // regex or format - keep as string
      processedValue = newRuleValue;
    }

    const newRule: ValidationRule = {
      fieldName: newRuleFieldName.trim(),
      ruleType: newRuleType,
      value: processedValue,
      errorMessage: newRuleErrorMessage.trim(),
    };

    setValidationRules([...validationRules, newRule]);
    setShowAddRuleModal(false);
    setNewRuleFieldName('');
    setNewRuleValue('');
    setNewRuleErrorMessage('');
  };

  const handleRemoveValidationRule = (index: number) => {
    setValidationRules(validationRules.filter((_, i) => i !== index));
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
      // IT-defined operations (applies globally to all endpoints)
      operations: {
        subscribe: opSubscribe,
        read: opRead,
        write: opWrite,
      },
      namingConvention: namingConvention.trim() || undefined,
      validationRules: validationRules.length > 0 ? validationRules : undefined,
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

      {/* Operations Settings Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Operations Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          Define which operations are allowed for this integration. These settings apply globally to all endpoints.
        </p>

        <div className="space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={opSubscribe}
              onChange={(e) => setOpSubscribe(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Subscribe</div>
              <div className="text-xs text-gray-600">
                Allow real-time subscriptions to data changes (push notifications when values update)
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={opRead}
              onChange={(e) => setOpRead(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Read</div>
              <div className="text-xs text-gray-600">
                Allow reading current values on demand (poll for current state)
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={opWrite}
              onChange={(e) => setOpWrite(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Write</div>
              <div className="text-xs text-gray-600">
                Allow writing values to endpoints (control setpoints, commands, etc.)
              </div>
            </div>
          </label>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> These operations apply to all endpoints in this request. OT does not need to specify operations per endpoint.
          </p>
        </div>
      </div>

      {/* Naming Convention Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Naming Convention</h2>
        <p className="text-sm text-gray-600 mb-4">
          Define a naming pattern for endpoints. Use placeholders that OT will fill in when entering data.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Naming Template
          </label>
          <input
            type="text"
            value={namingConvention}
            onChange={(e) => setNamingConvention(e.target.value)}
            placeholder="{Asset}_{Parameter}_{Unit}"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use placeholders like {'{Asset}'}, {'{Parameter}'}, {'{Unit}'}, {'{Location}'}, etc.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Available Placeholders:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
            <div><code className="bg-blue-100 px-1 rounded">{'{Asset}'}</code> - Asset ID or name</div>
            <div><code className="bg-blue-100 px-1 rounded">{'{Parameter}'}</code> - Data point parameter</div>
            <div><code className="bg-blue-100 px-1 rounded">{'{Unit}'}</code> - Unit of measurement</div>
            <div><code className="bg-blue-100 px-1 rounded">{'{Location}'}</code> - Physical location</div>
            <div><code className="bg-blue-100 px-1 rounded">{'{Type}'}</code> - Sensor or device type</div>
            <div><code className="bg-blue-100 px-1 rounded">{'{Index}'}</code> - Numeric index</div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            <strong>Example:</strong> If template is <code className="bg-blue-100 px-1 rounded">{'{Asset}_{Parameter}_{Unit}'}</code>,
            OT might enter: <code className="bg-blue-100 px-1 rounded">PLC-01_Temperature_Celsius</code>
          </p>
        </div>
      </div>

      {/* Validation Rules Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Validation Rules</h2>
          <button
            onClick={() => setShowAddRuleModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Rule
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Define validation rules that OT must follow when entering data. Rules are enforced in real-time.
        </p>

        {validationRules.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-lg">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No validation rules defined</p>
            <p className="text-xs text-gray-500">Click "Add Rule" to create validation rules for OT data entry</p>
          </div>
        ) : (
          <div className="space-y-2">
            {validationRules.map((rule, index) => (
              <div key={index} className="flex items-start justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{rule.fieldName}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {rule.ruleType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    Value: <code className="bg-gray-100 px-1 rounded">{
                      typeof rule.value === 'object' && !Array.isArray(rule.value)
                        ? `min: ${rule.value.min ?? 'none'}, max: ${rule.value.max ?? 'none'}`
                        : Array.isArray(rule.value)
                        ? rule.value.join(', ')
                        : rule.value
                    }</code>
                  </p>
                  <p className="text-xs text-gray-500">Error: {rule.errorMessage}</p>
                </div>
                <button
                  onClick={() => handleRemoveValidationRule(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Validation rules are enforced in real-time as OT enters data. Invalid entries will be highlighted with clear error messages.
          </p>
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

      {/* Add Validation Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Validation Rule</h3>
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Field Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Field Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRuleFieldName}
                  onChange={(e) => setNewRuleFieldName(e.target.value)}
                  placeholder="e.g., name, address, port"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The field this rule applies to (must match field names in your template)
                </p>
              </div>

              {/* Rule Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Rule Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="regex">Regular Expression (regex)</option>
                  <option value="format">Format Pattern</option>
                  <option value="enum">Allowed Values (enum)</option>
                  <option value="range">Numeric Range</option>
                </select>
              </div>

              {/* Rule Value */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Rule Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRuleValue}
                  onChange={(e) => setNewRuleValue(e.target.value)}
                  placeholder={
                    newRuleType === 'regex' ? '^[A-Z0-9_]+$' :
                    newRuleType === 'enum' ? 'option1, option2, option3' :
                    newRuleType === 'range' ? '0, 100' :
                    'pattern'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newRuleType === 'regex' && 'A regular expression pattern (e.g., ^[A-Z0-9_]+$)'}
                  {newRuleType === 'format' && 'A format string (e.g., XXX-XXX-XXXX for phone)'}
                  {newRuleType === 'enum' && 'Comma-separated allowed values'}
                  {newRuleType === 'range' && 'Two numbers: min, max (e.g., 0, 100)'}
                </p>
              </div>

              {/* Error Message */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Error Message <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRuleErrorMessage}
                  onChange={(e) => setNewRuleErrorMessage(e.target.value)}
                  placeholder="e.g., Must be uppercase letters, numbers, and underscores only"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The message OT will see when validation fails
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddValidationRule}
                disabled={!newRuleFieldName.trim() || !newRuleValue.trim() || !newRuleErrorMessage.trim()}
                className={`px-4 py-2 rounded-lg ${
                  newRuleFieldName.trim() && newRuleValue.trim() && newRuleErrorMessage.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewAndSend;
