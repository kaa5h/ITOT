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
    return displayEndpoints.map((endpoint, index) => {
      const cells: DefaultCellTypes[] = [
        // Row number
        { type: 'text', text: (index + 1).toString(), nonEditable: true } as TextCell,
        // Actions cell (custom)
        { type: 'text', text: '🗑️', nonEditable: true } as TextCell,
      ];

      templateFields.forEach((field) => {
        const value = (endpoint.fields as Record<string, any>)[field.name] || '';

        switch (field.type) {
          case 'select':
            cells.push({
              type: 'dropdown',
              selectedValue: value?.toString() || '',
              values: [{ value: '', label: 'Select...' }, ...(field.options || []).map(opt => ({ value: opt, label: opt }))],
              isOpen: false,
              isDisabled: false,
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
  }, [displayEndpoints, templateFields]);

  const rows = useMemo(() => [headerRow, ...dataRows], [headerRow, dataRows]);

  // Handle cell changes
  const handleChanges = useCallback(
    (changes: CellChange[]) => {
      let updatedDisplayEndpoints = [...displayEndpoints];

      changes.forEach((change) => {
        const rowId = change.rowId as string;
        const columnId = change.columnId as string;

        // Skip header and action columns
        if (rowId === 'header' || columnId === 'rowNumber' || columnId === 'actions') {
          return;
        }

        const endpointIndex = updatedDisplayEndpoints.findIndex((ep) => ep.id === rowId);
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

        // Convert blank row to real endpoint if it was a blank
        const currentEndpoint = updatedDisplayEndpoints[endpointIndex];
        const isBlankRow = currentEndpoint.id.startsWith('blank-');

        if (isBlankRow) {
          // Create new real endpoint
          updatedDisplayEndpoints[endpointIndex] = {
            id: 'ep-' + Date.now() + '-' + endpointIndex,
            fields: {
              [columnId]: newValue,
            },
            completed: false,
          };
        } else {
          // Update existing endpoint
          updatedDisplayEndpoints[endpointIndex] = {
            ...currentEndpoint,
            fields: {
              ...currentEndpoint.fields,
              [columnId]: newValue,
            },
          };
        }
      });

      // Filter out blank rows and save only real endpoints
      const realEndpoints = updatedDisplayEndpoints.filter(ep => !ep.id.startsWith('blank-'));
      onEndpointsChange(realEndpoints);
    },
    [displayEndpoints, templateFields, onEndpointsChange]
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
      if (location.columnId === 'actions' && location.rowId !== 'header') {
        const rowIdStr = location.rowId as string;
        const isBlankRow = rowIdStr.startsWith('blank-');

        // Don't delete blank rows, just skip
        if (isBlankRow) {
          return;
        }

        // Only delete real endpoints, and keep at least 1
        const realEndpoints = displayEndpoints.filter(ep => !ep.id.startsWith('blank-'));
        if (realEndpoints.length > 1) {
          setTimeout(() => {
            const updatedEndpoints = endpoints.filter((ep) => ep.id !== location.rowId);
            onEndpointsChange(updatedEndpoints);
          }, 100);
        }
      }
    },
    [endpoints, displayEndpoints, onEndpointsChange]
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
