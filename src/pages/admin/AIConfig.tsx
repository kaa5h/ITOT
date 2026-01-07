import React, { useState } from 'react';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

const AIConfig: React.FC = () => {
  const [endpoint, setEndpoint] = useState('https://ai.company.com/scf-gen');
  const [apiKey, setApiKey] = useState('sk_demo_1234567890abcdefghijklmnopqrstuvwxyz');
  const [showApiKey, setShowApiKey] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv' | 'yaml'>('json');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTestConnection = () => {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    }, 1500);
  };

  const handleSave = () => {
    alert('Configuration saved - simulated for demo');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Integration Configuration</h1>
        <p className="text-gray-600">Configure AI agent endpoint and export settings</p>
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* AI Endpoint */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            AI Agent Endpoint
          </label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://ai.company.com/scf-gen"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            URL endpoint where exported data will be sent
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Authentication key for AI service
          </p>
        </div>

        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Default Export Format
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="radio"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">JSON</div>
                <div className="text-sm text-gray-500">Structured data format</div>
              </div>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="radio"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">CSV</div>
                <div className="text-sm text-gray-500">Tabular format</div>
              </div>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="radio"
                value="yaml"
                checked={format === 'yaml'}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">YAML</div>
                <div className="text-sm text-gray-500">Hierarchical format</div>
              </div>
            </label>
          </div>
        </div>

        {/* Test Connection */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Connection Test</h3>
              <p className="text-sm text-gray-500">Verify AI endpoint is accessible</p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className={`px-4 py-2 rounded-lg transition-colors ${
                testStatus === 'testing'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {testStatus === 'success' && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Connected successfully</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 flex items-center space-x-4">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Configuration
          </button>
          <button
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Note:</span> These settings affect how data is exported to the AI
          agent for service commissioning file generation. Changes will apply to all future exports.
        </p>
      </div>
    </div>
  );
};

export default AIConfig;
