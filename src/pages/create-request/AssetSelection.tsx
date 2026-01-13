import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';
import { Asset } from '../../types';

const AssetSelection: React.FC = () => {
  const navigate = useNavigate();
  const { unsLevels } = useAppContext();
  const { setSelectedAsset, setStep } = useRequestCreation();

  // State for each UNS level input
  const [levelValues, setLevelValues] = useState<Record<string, string>>({});
  const [machineName, setMachineName] = useState('');

  const handleLevelChange = (levelId: string, value: string) => {
    setLevelValues(prev => ({
      ...prev,
      [levelId]: value
    }));
  };

  const handleNext = () => {
    // All levels must be filled
    const allFilled = unsLevels.every(level => levelValues[level.id]?.trim());
    const machineNameFilled = machineName.trim();

    if (!allFilled || !machineNameFilled) {
      return;
    }

    // Create a pseudo asset from the manual input
    const location = unsLevels.map(level => levelValues[level.id]).join(' > ');
    const assetId = `MANUAL-${Date.now()}`;

    const manualAsset: Asset = {
      id: assetId,
      name: machineName,
      type: 'Manual Entry',
      location: location,
      company: levelValues[unsLevels[0]?.id] || '',
      plant: levelValues[unsLevels[1]?.id] || '',
      shop: levelValues[unsLevels[2]?.id] || '',
      line: levelValues[unsLevels[3]?.id] || '',
      station: levelValues[unsLevels[4]?.id] || '',
      owner: 'TBD', // Will be assigned later
    };

    setSelectedAsset(manualAsset);
    setStep(2);
    navigate('/create-request/describe');
  };

  const allLevelsFilled = unsLevels.every(level => levelValues[level.id]?.trim());
  const canProceed = allLevelsFilled && machineName.trim();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
        <p className="text-gray-600">Step 1 of 3: Describe Asset Location</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className="flex-1">
            <div className="h-1 bg-blue-600 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-gray-200 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span className="font-medium text-blue-600">Asset Location</span>
          <span>Describe Data</span>
          <span>Review</span>
        </div>
      </div>

      {/* Manual Input Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Asset Location</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter the asset location using the UNS hierarchy structure.
        </p>

        <div className="space-y-4">
          {/* UNS Level Inputs */}
          {unsLevels.map((level) => (
            <div key={level.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {level.name} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={levelValues[level.id] || ''}
                onChange={(e) => handleLevelChange(level.id, e.target.value)}
                placeholder={`Enter ${level.name.toLowerCase()}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          {/* Machine Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              placeholder="Enter machine name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      {(allLevelsFilled || machineName) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Preview</h3>
          <div className="text-sm text-blue-800">
            {unsLevels.map((level, index) => (
              <React.Fragment key={level.id}>
                {levelValues[level.id] && (
                  <>
                    <span className="font-medium">{levelValues[level.id]}</span>
                    {index < unsLevels.length - 1 && <span className="mx-1">→</span>}
                  </>
                )}
              </React.Fragment>
            ))}
            {machineName && (
              <>
                {allLevelsFilled && <span className="mx-1">→</span>}
                <span className="font-medium">{machineName}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Next step:</strong> You'll describe what data you need from this machine.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors ${
            canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next: Describe Data
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default AssetSelection;
