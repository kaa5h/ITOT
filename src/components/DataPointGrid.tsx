import React, { useMemo, useCallback, useState } from 'react';
import { Endpoint, TemplateField, ValidationRule } from '../types';
import { Plus, Trash2, X, Columns, AlertCircle } from 'lucide-react';

interface DataPointGridProps {
  endpoints: Endpoint[];
  templateFields: TemplateField[];
  onEndpointsChange: (endpoints: Endpoint[]) => void;
  customFields?: TemplateField[];
  onCustomFieldsChange?: (fields: TemplateField[]) => void;
  validationRules?: ValidationRule[];
  namingConvention?: string;
}

export const DataPointGrid: React.FC<DataPointGridProps> = ({
  endpoints,
  templateFields,
  onEndpointsChange,
  customFields = [],
  onCustomFieldsChange,
  validationRules = [],
  namingConvention: _namingConvention, // Reserved for future auto-naming functionality
}) => {
  // Add Column Modal State
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'number' | 'select' | 'textarea'>('text');

  // Validation errors: Map<endpointId_fieldName, errorMessage>
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  // Combine template fields with custom fields
  const allFields = useMemo(() => [...templateFields, ...customFields], [templateFields, customFields]);

  // Validation function
  const validateField = useCallback((fieldName: string, value: string): string | null => {
    const rule = validationRules.find(r => r.fieldName === fieldName);
    if (!rule || !value) return null; // No rule or empty value - no error

    switch (rule.ruleType) {
      case 'regex': {
        try {
          const regex = new RegExp(rule.value as string);
          if (!regex.test(value)) {
            return rule.errorMessage;
          }
        } catch (e) {
          console.error('Invalid regex pattern:', rule.value);
        }
        break;
      }

      case 'enum': {
        const allowedValues = rule.value as string[];
        if (!allowedValues.includes(value)) {
          return rule.errorMessage;
        }
        break;
      }

      case 'range': {
        const numValue = parseFloat(value);
        const range = rule.value as { min?: number; max?: number };
        if (isNaN(numValue)) {
          return 'Must be a valid number';
        }
        if (range.min !== undefined && numValue < range.min) {
          return rule.errorMessage;
        }
        if (range.max !== undefined && numValue > range.max) {
          return rule.errorMessage;
        }
        break;
      }

      case 'format': {
        // Simple format validation (could be enhanced)
        const format = rule.value as string;
        if (value.length !== format.length) {
          return rule.errorMessage;
        }
        break;
      }
    }

    return null; // No error
  }, [validationRules]);

  // Ensure minimum 15 rows
  const displayEndpoints = useMemo(() => {
    const minRows = 15;
    if (endpoints.length >= minRows) {
      return endpoints;
    }

    // Add blank rows to reach 15
    const blankRows = Array.from({ length: minRows - endpoints.length }, (_, i) => ({
      id: `blank-${Date.now()}-${i}`,
      fields: {},
      completed: false,
    }));

    return [...endpoints, ...blankRows];
  }, [endpoints]);

  const handleCellChange = useCallback(
    (rowId: string, fieldName: string, value: any) => {
      const rowIndex = displayEndpoints.findIndex((ep) => ep.id === rowId);
      if (rowIndex === -1) return;

      const updatedDisplayEndpoints = [...displayEndpoints];
      const currentEndpoint = updatedDisplayEndpoints[rowIndex];
      const isBlankRow = currentEndpoint.id.startsWith('blank-');

      let actualRowId = rowId;
      if (isBlankRow) {
        // Convert blank row to real endpoint
        actualRowId = 'ep-' + Date.now() + '-' + rowIndex;
        updatedDisplayEndpoints[rowIndex] = {
          id: actualRowId,
          fields: {
            [fieldName]: value,
          },
          completed: false,
        };
      } else {
        // Update existing endpoint
        updatedDisplayEndpoints[rowIndex] = {
          ...currentEndpoint,
          fields: {
            ...currentEndpoint.fields,
            [fieldName]: value,
          },
        };
      }

      // Validate the field
      const error = validateField(fieldName, value?.toString() || '');
      const errorKey = `${actualRowId}_${fieldName}`;
      setValidationErrors(prev => {
        const newErrors = new Map(prev);
        if (error) {
          newErrors.set(errorKey, error);
        } else {
          newErrors.delete(errorKey);
        }
        return newErrors;
      });

      // Filter out blank rows and save only real endpoints
      const realEndpoints = updatedDisplayEndpoints.filter(ep => !ep.id.startsWith('blank-'));
      onEndpointsChange(realEndpoints);
    },
    [displayEndpoints, onEndpointsChange, validateField]
  );

  const handleAddRow = () => {
    const newEndpoint: Endpoint = {
      id: 'ep-' + Date.now(),
      fields: {},
      completed: false,
    };
    onEndpointsChange([...endpoints, newEndpoint]);
  };

  const handleDeleteRow = (rowId: string) => {
    const isBlankRow = rowId.startsWith('blank-');
    if (isBlankRow) return;

    const realEndpoints = displayEndpoints.filter(ep => !ep.id.startsWith('blank-'));
    if (realEndpoints.length > 1) {
      const updatedEndpoints = endpoints.filter((ep) => ep.id !== rowId);
      onEndpointsChange(updatedEndpoints);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim() || !onCustomFieldsChange) {
      return;
    }

    // Check if column already exists
    const columnExists = allFields.some(f => f.name.toLowerCase() === newColumnName.toLowerCase());
    if (columnExists) {
      alert('A column with this name already exists');
      return;
    }

    const newField: TemplateField = {
      name: newColumnName.trim(),
      label: newColumnName.trim(),
      type: newColumnType,
      required: false,
      placeholder: `Enter ${newColumnName}...`,
    };

    onCustomFieldsChange([...customFields, newField]);
    setShowAddColumnModal(false);
    setNewColumnName('');
    setNewColumnType('text');
  };

  const renderCell = (endpoint: Endpoint, field: TemplateField) => {
    const value = (endpoint.fields as Record<string, any>)[field.name] || '';
    const errorKey = `${endpoint.id}_${field.name}`;
    const hasError = validationErrors.has(errorKey);
    const errorMessage = validationErrors.get(errorKey);

    const cellClasses = `px-2 py-1 border-r focus:outline-none focus:ring-1 w-full text-sm ${
      hasError
        ? 'border-red-500 bg-red-50 focus:ring-red-500'
        : 'border-gray-200 focus:ring-blue-500'
    }`;

    const renderInput = () => {
      switch (field.type) {
        case 'select':
          return (
            <select
              value={value?.toString() || ''}
              onChange={(e) => handleCellChange(endpoint.id, field.name, e.target.value)}
              className={cellClasses}
              title={hasError ? errorMessage : ''}
            >
              <option value="">Select...</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );

        case 'number':
          return (
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleCellChange(endpoint.id, field.name, e.target.value)}
              className={cellClasses}
              placeholder="0"
              title={hasError ? errorMessage : ''}
            />
          );

        case 'textarea':
          return (
            <textarea
              value={value || ''}
              onChange={(e) => handleCellChange(endpoint.id, field.name, e.target.value)}
              className={`${cellClasses} resize-none`}
              rows={2}
              placeholder={field.placeholder || ''}
              title={hasError ? errorMessage : ''}
            />
          );

        default:
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleCellChange(endpoint.id, field.name, e.target.value)}
              className={cellClasses}
              placeholder={field.placeholder || ''}
              title={hasError ? errorMessage : ''}
            />
          );
      }
    };

    return (
      <div className="relative">
        {renderInput()}
        {hasError && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" title={errorMessage}>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          DATA POINTS (Excel-style Configuration)
        </h2>
        <div className="flex items-center space-x-2">
          {onCustomFieldsChange && (
            <button
              onClick={() => setShowAddColumnModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Columns className="w-4 h-4 mr-1" />
              Add Column
            </button>
          )}
          <button
            onClick={handleAddRow}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Row
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-24rem)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 w-12">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 w-16">
                  Actions
                </th>
                {allFields.map((field) => (
                  <th
                    key={field.name}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[150px]"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayEndpoints.map((endpoint, index) => {
                const isBlankRow = endpoint.id.startsWith('blank-');
                return (
                  <tr key={endpoint.id} className={`hover:bg-gray-50 ${isBlankRow ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                      {index + 1}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap border-r border-gray-200">
                      <button
                        onClick={() => handleDeleteRow(endpoint.id)}
                        className={`text-gray-400 hover:text-red-600 transition-colors ${
                          isBlankRow ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        disabled={isBlankRow}
                        title={isBlankRow ? 'Cannot delete blank rows' : 'Delete row'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    {allFields.map((field) => (
                      <td key={field.name} className="p-0 border-r border-gray-200">
                        {renderCell(endpoint, field)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="font-medium mb-1">Excel-like controls:</p>
        <ul className="space-y-1 text-xs">
          <li>• Click any cell to edit directly</li>
          <li>• Use Tab to move to next cell, Shift+Tab to move back</li>
          <li>• Use arrow keys to navigate between cells</li>
          <li>• Click <Trash2 className="w-3 h-3 inline" /> to delete a row</li>
          <li>• Click "Add Row" to insert new data point</li>
          <li>• Click "Add Column" to add custom fields as needed</li>
          <li>• Dropdowns work with click or keyboard (↑↓ arrows + Enter)</li>
          <li>• Grid shows minimum 15 rows, blank rows auto-convert when you type</li>
        </ul>
      </div>

      {/* Add Column Modal */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Columns className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Add Custom Column</h2>
              </div>
              <button
                onClick={() => setShowAddColumnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  Add a custom field when the template doesn't include a field you need.
                  This helps when machines expose data differently.
                </p>
              </div>

              {/* Column Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Column Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="e.g., Custom Tag ID, Alarm Priority, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Column Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="textarea">Long Text</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowAddColumnModal(false);
                  setNewColumnName('');
                  setNewColumnType('text');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  newColumnName.trim()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
