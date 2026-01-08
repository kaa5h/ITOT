import React, { useMemo, useCallback } from 'react';
import { ReactGrid, Column, Row, CellChange, TextCell, DropdownCell, NumberCell, HeaderCell, DefaultCellTypes } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { Endpoint, TemplateField } from '../types';
import { Plus } from 'lucide-react';

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
  // Build columns from template fields
  const columns = useMemo((): Column[] => {
    const cols: Column[] = [
      { columnId: 'rowNumber', width: 50, resizable: false },
      { columnId: 'actions', width: 80, resizable: false },
    ];

    templateFields.forEach((field) => {
      cols.push({
        columnId: field.name,
        width: 150,
        resizable: true,
      });
    });

    return cols;
  }, [templateFields]);

  // Build header row
  const headerRow = useMemo((): Row<DefaultCellTypes> => {
    const cells: DefaultCellTypes[] = [
      { type: 'header', text: '#' } as HeaderCell,
      { type: 'header', text: 'Actions' } as HeaderCell,
    ];

    templateFields.forEach((field) => {
      cells.push({
        type: 'header',
        text: field.label + (field.required ? ' *' : ''),
      } as HeaderCell);
    });

    return {
      rowId: 'header',
      cells,
    };
  }, [templateFields]);

  // Build data rows
  const dataRows = useMemo((): Row<DefaultCellTypes>[] => {
    return endpoints.map((endpoint, index) => {
      const cells: DefaultCellTypes[] = [
        // Row number
        { type: 'text', text: (index + 1).toString(), nonEditable: true } as TextCell,
        // Actions cell (custom)
        { type: 'text', text: '🗑️', nonEditable: true } as TextCell,
      ];

      templateFields.forEach((field) => {
        const value = endpoint.fields[field.name] || '';

        switch (field.type) {
          case 'select':
            cells.push({
              type: 'dropdown',
              selectedValue: value?.toString() || '',
              values: [{ value: '', label: 'Select...' }, ...(field.options || []).map(opt => ({ value: opt, label: opt }))],
              isOpen: false,
            } as DropdownCell);
            break;

          case 'number':
            cells.push({
              type: 'number',
              value: value ? parseFloat(value) : 0,
            } as NumberCell);
            break;

          default:
            cells.push({
              type: 'text',
              text: value?.toString() || '',
            } as TextCell);
            break;
        }
      });

      return {
        rowId: endpoint.id,
        cells,
      };
    });
  }, [endpoints, templateFields]);

  const rows = useMemo(() => [headerRow, ...dataRows], [headerRow, dataRows]);

  // Handle cell changes
  const handleChanges = useCallback(
    (changes: CellChange[]) => {
      const updatedEndpoints = [...endpoints];

      changes.forEach((change) => {
        const rowId = change.rowId as string;
        const columnId = change.columnId as string;

        // Skip header and action columns
        if (rowId === 'header' || columnId === 'rowNumber' || columnId === 'actions') {
          return;
        }

        const endpointIndex = updatedEndpoints.findIndex((ep) => ep.id === rowId);
        if (endpointIndex === -1) return;

        const field = templateFields.find((f) => f.name === columnId);
        if (!field) return;

        let newValue: any;

        switch (change.type) {
          case 'text':
            newValue = (change as any).newCell.text;
            break;
          case 'number':
            newValue = (change as any).newCell.value;
            break;
          case 'dropdown':
            newValue = (change as any).newCell.selectedValue;
            break;
          default:
            newValue = '';
        }

        updatedEndpoints[endpointIndex] = {
          ...updatedEndpoints[endpointIndex],
          fields: {
            ...updatedEndpoints[endpointIndex].fields,
            [columnId]: newValue,
          },
        };
      });

      onEndpointsChange(updatedEndpoints);
    },
    [endpoints, templateFields, onEndpointsChange]
  );

  const handleAddRow = () => {
    const newEndpoint: Endpoint = {
      id: 'ep-' + Date.now(),
      fields: {},
      completed: false,
    };
    onEndpointsChange([...endpoints, newEndpoint]);
  };

  // Handle cell focus to detect clicks on action column
  const handleFocusLocation = useCallback(
    (location: { rowId: string | number; columnId: string | number }) => {
      if (location.columnId === 'actions' && location.rowId !== 'header' && endpoints.length > 1) {
        // Delay to ensure it's a click not just navigation
        setTimeout(() => {
          const updatedEndpoints = endpoints.filter((ep) => ep.id !== location.rowId);
          if (updatedEndpoints.length !== endpoints.length) {
            onEndpointsChange(updatedEndpoints);
          }
        }, 100);
      }
    },
    [endpoints, onEndpointsChange]
  );

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
        <div className="overflow-auto max-h-[calc(100vh-24rem)]" style={{ maxWidth: '100%' }}>
          <ReactGrid
            rows={rows}
            columns={columns}
            onCellsChanged={handleChanges}
            onFocusLocationChanged={handleFocusLocation}
            enableRangeSelection
            enableRowSelection
            enableColumnSelection
            stickyTopRows={1}
          />
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="font-medium mb-1">Excel-like controls:</p>
        <ul className="space-y-1 text-xs">
          <li>• Click any cell to edit</li>
          <li>• Press Tab to move to next cell, Shift+Tab to move back</li>
          <li>• Press Enter to move down, Shift+Enter to move up</li>
          <li>• Click 🗑️ in Actions column to delete a row</li>
          <li>• Use Ctrl+C to copy, Ctrl+V to paste (multi-cell support)</li>
          <li>• Drag column borders to resize</li>
        </ul>
      </div>
    </div>
  );
};
