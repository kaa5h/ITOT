import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRequestCreation } from '../../context/RequestCreationContext';

const DataDescription: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedAsset,
    description: savedDescription,
    setDescription,
    setStep,
  } = useRequestCreation();

  const [description, setLocalDescription] = useState(savedDescription);

  if (!selectedAsset) {
    navigate('/create-request/asset');
    return null;
  }

  const handleNext = () => {
    if (description.trim()) {
      setDescription(description);
      setStep(3);
      navigate('/create-request/review');
    }
  };

  const handlePrevious = () => {
    setStep(1);
    navigate('/create-request/asset');
  };

  const charCount = description.length;
  const maxChars = 500;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
        <p className="text-gray-600">Step 2 of 3: Describe What Data You Need</p>
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
            <div className="h-1 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Asset</span>
          <span className="font-medium text-blue-600">Describe Data</span>
          <span>Review</span>
        </div>
      </div>

      {/* Asset Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          What data do you need from: {selectedAsset.id}?
        </h3>
        <p className="text-sm text-blue-700">
          {selectedAsset.name} - {selectedAsset.location}
        </p>
      </div>

      {/* Main Description */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Describe the data points you need <span className="text-red-500">*</span>
        </h2>
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Be specific about:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Which exact sensor/measurement?</strong> (This machine may have many similar sensors)</li>
            <li>• <strong>Location or identifying details</strong> (e.g., "PRIMARY cooling loop, not secondary")</li>
            <li>• <strong>What you'll use this data for</strong> (Helps OT understand the requirement)</li>
            <li>• <strong>Clarify any naming ambiguities</strong> (e.g., which of the 15 temperature sensors?)</li>
          </ul>
        </div>
        <textarea
          value={description}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="Example: Need outlet temperature from PRIMARY cooling loop (not secondary or tertiary). This is the sensor measuring coolant as it exits the heat exchanger. Will use for energy monitoring dashboard.

Also need inlet pressure measurement for the same cooling loop to calculate pressure differential."
          className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          maxLength={maxChars}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-500">
            {charCount}/{maxChars} characters
          </span>
          {charCount > 0 && charCount < 50 && (
            <span className="text-sm text-amber-600">
              Try to be more specific - this helps OT provide accurate data
            </span>
          )}
        </div>
      </div>

      {/* Helper Info */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-800">
              <strong>Why be specific?</strong> Machines often have cryptic names and multiple similar sensors.
              The more specific you are now, the less back-and-forth will be needed. OT personnel know the
              machines but need your help identifying <em>which</em> data you actually need.
            </p>
          </div>
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
          onClick={handleNext}
          disabled={!description.trim()}
          className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors ${
            description.trim()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next: Review
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default DataDescription;
