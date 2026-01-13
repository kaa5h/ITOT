import React, { useState } from 'react';
import { Plus, X, Save, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UNSLevel } from '../types';

const UNSConfig: React.FC = () => {
  const { unsLevels, setUNSLevels } = useAppContext();
  const [levels, setLevels] = useState<UNSLevel[]>([...unsLevels]);
  const [newLevelName, setNewLevelName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAddLevel = () => {
    if (!newLevelName.trim()) return;

    const newLevel: UNSLevel = {
      id: `level-${Date.now()}`,
      name: newLevelName.trim(),
      order: levels.length + 1,
    };

    setLevels([...levels, newLevel]);
    setNewLevelName('');
    setShowAddInput(false);
  };

  const handleRemoveLevel = (id: string) => {
    const filtered = levels.filter(l => l.id !== id);
    // Re-order after removal
    const reordered = filtered.map((level, index) => ({
      ...level,
      order: index + 1,
    }));
    setLevels(reordered);
  };

  const handleSave = () => {
    setUNSLevels(levels);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaultLevels: UNSLevel[] = [
      { id: 'level-1', name: 'Company', order: 1 },
      { id: 'level-2', name: 'Plant', order: 2 },
      { id: 'level-3', name: 'Shop', order: 3 },
      { id: 'level-4', name: 'Line', order: 4 },
      { id: 'level-5', name: 'Cell', order: 5 },
      { id: 'level-6', name: 'Machine', order: 6 },
    ];
    setLevels(defaultLevels);
  };

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === levels.length - 1) return;

    const newLevels = [...levels];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap
    [newLevels[index], newLevels[targetIndex]] = [newLevels[targetIndex], newLevels[index]];

    // Re-order
    const reordered = newLevels.map((level, i) => ({
      ...level,
      order: i + 1,
    }));

    setLevels(reordered);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manual UNS Structure Input</h1>
        <p className="text-gray-600">Define the hierarchy levels for your Unified Namespace structure</p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Power User Feature:</strong> Define the UNS hierarchy structure once. This structure will be used in the IT request creation flow for manual asset input.
        </p>
      </div>

      {/* Levels List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">UNS Hierarchy Levels</h2>
          <button
            onClick={() => setShowAddInput(true)}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Level
          </button>
        </div>

        {levels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No levels defined. Click "Add Level" to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {levels.map((level, index) => (
              <div
                key={level.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                {/* Order Number */}
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveLevel(index, 'up')}
                      disabled={index === 0}
                      className={`p-0.5 ${
                        index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Move up"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveLevel(index, 'down')}
                      disabled={index === levels.length - 1}
                      className={`p-0.5 ${
                        index === levels.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Move down"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-6">{level.order}.</span>
                </div>

                {/* Level Name */}
                <div className="flex-1">
                  <span className="text-sm text-gray-900">{level.name}</span>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveLevel(level.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove level"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Level Input */}
        {showAddInput && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              New Level Name
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddLevel();
                  if (e.key === 'Escape') {
                    setShowAddInput(false);
                    setNewLevelName('');
                  }
                }}
                placeholder="e.g., Region, Site, Building"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleAddLevel}
                disabled={!newLevelName.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newLevelName.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddInput(false);
                  setNewLevelName('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Structure Preview</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          {levels.length === 0 ? (
            <span className="text-gray-500">No levels defined</span>
          ) : (
            levels.map((level, index) => (
              <React.Fragment key={level.id}>
                <span className="font-medium">{level.name}</span>
                {index < levels.length - 1 && (
                  <span className="text-gray-400">→</span>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </button>

        <button
          onClick={handleSave}
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Saved!' : 'Save Structure'}
        </button>
      </div>

      {/* Saved Feedback */}
      {saved && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            UNS structure saved successfully! This structure will now be used in the request creation flow.
          </p>
        </div>
      )}
    </div>
  );
};

export default UNSConfig;
