import React, { useMemo, useCallback } from 'react';
import { Endpoint, TemplateField } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface DataPointGridProps {
  endpoints: Endpoint[];
  templateFields: TemplateField[];
  onEndpointsChange: (endpoints: Endpoint[]) => void;
}

export const DataPointGrid: React.FC<DataPointGridProps> = ({
  endpoints,
  templateFields,
  onEndpointsChange,
}) => {
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

      if (isBlankRow) {
        // Convert blank row to real endpoint
        updatedDisplayEndpoints[rowIndex] = {
          id: 'ep-' + Date.now() + '-' + rowIndex,
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

      // Filter out blank rows and save only real endpoints
      const realEndpoints = updatedDisplayEndpoints.filter(ep => !ep.id.startsWith('blank-'));
      onEndpointsChange(realEndpoints);
    },
    [displayEndpoints, onEndpointsChange]
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

  const renderCell = (endpoint: Endpoint, field: TemplateField) => {
    const value = (endpoint.fields as Record<string, any>)[field.name] || '';
    const cellClasses = "px-2 py-1 border-r border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-sm";

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value?.toString() || ''}
            onChange={(e) => handleCellChange(endpoint.id, field.name, e.target.value)}
            className={cellClasses}
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
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          DATA POINTS (Excel-style Configuration)
        </h2>
        <button
          onClick={handleAddRow}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Row
        </button>
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
                {templateFields.map((field) => (
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
                    {templateFields.map((field) => (
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
          <li>• Dropdowns work with click or keyboard (↑↓ arrows + Enter)</li>
          <li>• Grid shows minimum 15 rows, blank rows auto-convert when you type</li>
        </ul>
      </div>
    </div>
  );
};
