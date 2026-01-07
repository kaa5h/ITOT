import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, CheckCircle, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ExportFormat } from '../types';

const ExportData: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests, updateRequest } = useAppContext();

  const [format, setFormat] = useState<ExportFormat>('json');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);

  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found</p>
      </div>
    );
  }

  const generateExportData = () => {
    const exportData = {
      export_id: `EXPORT-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      request_id: request.id,
      timestamp: new Date().toISOString(),
      machine: {
        asset_id: request.assetId,
        name: request.assetName,
        type: 'Machine',
        location: request.location,
      },
      context: {
        requestor: request.createdBy,
        description: request.context,
      },
      connection: request.connection,
      endpoints: request.endpoints.map((ep) => ep.fields),
      conversation_history: request.conversation,
      validation: {
        ot_completed: true,
        it_reviewed: true,
        tested: false,
      },
    };

    return exportData;
  };

  const formatData = (data: any, format: ExportFormat) => {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'yaml':
        // Simple YAML formatting
        const yamlLines: string[] = [];
        const toYaml = (obj: any, indent = 0) => {
          const spaces = '  '.repeat(indent);
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              yamlLines.push(`${spaces}${key}:`);
              toYaml(value, indent + 1);
            } else if (Array.isArray(value)) {
              yamlLines.push(`${spaces}${key}:`);
              value.forEach((item) => {
                if (typeof item === 'object') {
                  yamlLines.push(`${spaces}  -`);
                  toYaml(item, indent + 2);
                } else {
                  yamlLines.push(`${spaces}  - ${item}`);
                }
              });
            } else {
              yamlLines.push(`${spaces}${key}: ${value}`);
            }
          }
        };
        toYaml(data);
        return yamlLines.join('\n');
      case 'csv':
        // Simple CSV for endpoints
        const headers = Object.keys(data.endpoints[0] || {});
        const rows = data.endpoints.map((ep: any) =>
          headers.map((h) => ep[h] || '').join(',')
        );
        return [headers.join(','), ...rows].join('\n');
      default:
        return JSON.stringify(data, null, 2);
    }
  };

  const handleDownload = () => {
    const data = generateExportData();
    const formatted = formatData(data, format);
    const blob = new Blob([formatted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${request.id}-export.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendToAI = () => {
    const exportId = `EXPORT-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const exportedAt = new Date().toISOString();

    updateRequest(request.id, {
      status: 'complete',
      exportId,
      exportedAt,
    });

    setShowSuccess(true);
  };

  const handleViewDataPackage = () => {
    setShowDataPreview(true);
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Sent Successfully</h1>
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">Export ID:</div>
            <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded inline-block">
              {request.exportId}
            </div>
          </div>
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Data sent includes:
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Machine details</li>
              <li>• Connection parameters</li>
              <li>• Endpoint configurations ({request.endpoints.length} endpoints)</li>
              <li>• Full conversation ({request.conversation.length} messages)</li>
              <li>• Validation confirmations</li>
            </ul>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleViewDataPackage}
              className="flex-1 px-6 py-2 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              View Data Package
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showDataPreview) {
    const data = generateExportData();
    const formatted = formatData(data, format);

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Data Package Preview</h1>
          <p className="text-gray-600">Export ID: {data.export_id}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">
                {request.id}-export.{format}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(formatted);
                alert('Copied to clipboard!');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Copy to Clipboard
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
            {formatted}
          </pre>
        </div>
        <button
          onClick={() => setShowDataPreview(false)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Export Data Package</h1>
        <p className="text-gray-600">Send data to AI for processing</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Machine:</span>
            <span className="text-gray-900 font-medium">{request.assetId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Connection:</span>
            <span className="text-gray-900">{request.connection?.protocol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Endpoints:</span>
            <span className="text-gray-900">{request.endpoints.length} configured</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Discussion:</span>
            <span className="text-gray-900">{request.conversation.length} messages</span>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">OT completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">IT reviewed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h2>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <input
              type="radio"
              value="json"
              checked={format === 'json'}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">JSON (structured)</div>
              <div className="text-sm text-gray-500">Best for API integration</div>
            </div>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <input
              type="radio"
              value="csv"
              checked={format === 'csv'}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">CSV (tabular)</div>
              <div className="text-sm text-gray-500">Best for spreadsheets</div>
            </div>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <input
              type="radio"
              value="yaml"
              checked={format === 'yaml'}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">YAML (hierarchical)</div>
              <div className="text-sm text-gray-500">Best for configuration files</div>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </button>
          <button
            onClick={handleSendToAI}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Send to AI
          </button>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ExportData;
