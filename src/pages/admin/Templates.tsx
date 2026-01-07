import React, { useState } from 'react';
import { Upload, Eye, Edit, Power, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const Templates: React.FC = () => {
  const { templates } = useAppContext();
  const [viewTemplate, setViewTemplate] = useState<string | null>(null);

  const handleUpload = () => {
    alert('Upload new template functionality - simulated for demo');
  };

  const handleActivate = () => {
    alert('Template activated - simulated for demo');
  };

  const selectedTemplate = templates.find((t) => t.id === viewTemplate);

  if (viewTemplate && selectedTemplate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setViewTemplate(null)}
            className="inline-flex items-center text-blue-600 hover:underline mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Templates
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedTemplate.name} Template</h1>
          <p className="text-gray-600">Template details and structure</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Template Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Protocol:</span>{' '}
                <span className="text-gray-900">{selectedTemplate.protocol}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>{' '}
                <span className={selectedTemplate.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
                  {selectedTemplate.status}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>{' '}
                <span className="text-gray-900">
                  {selectedTemplate.fieldGroups ? 'Grouped (Complex)' : 'Flat (Simple)'}
                </span>
              </div>
            </div>
          </div>

          {selectedTemplate.fieldGroups ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Groups</h2>
              {selectedTemplate.fieldGroups.map((group) => (
                <div key={group.name} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
                  <h3 className="font-medium text-gray-900 mb-3">{group.name}</h3>
                  <div className="space-y-2">
                    {group.fields.map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                          {field.required && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{field.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fields</h2>
              <div className="space-y-2">
                {selectedTemplate.fields?.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{field.label}</span>
                      {field.required && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{field.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
            <p className="text-gray-600">Manage protocol templates</p>
          </div>
          <button
            onClick={handleUpload}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload New Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      template.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {template.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Protocol:</span> {template.protocol}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>{' '}
                    {template.fieldGroups ? 'Complex (Grouped Fields)' : 'Simple (Flat Fields)'}
                  </div>
                  <div>
                    <span className="font-medium">Fields:</span>{' '}
                    {template.fieldGroups
                      ? template.fieldGroups.reduce((sum, g) => sum + g.fields.length, 0)
                      : template.fields?.length || 0}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewTemplate(template.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>
                {template.status === 'inactive' ? (
                  <button
                    onClick={handleActivate}
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Activate"
                  >
                    <Power className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    title="Deactivate"
                  >
                    <Power className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
