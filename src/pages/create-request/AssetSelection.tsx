import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, FolderOpen, Folder, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';
import { Asset } from '../../types';

const AssetSelection: React.FC = () => {
  const navigate = useNavigate();
  const { assets } = useAppContext();
  const { setSelectedAsset, setStep } = useRequestCreation();

  const [viewMode, setViewMode] = useState<'directory' | 'uns'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Group assets by company → plant → shop → line → station for UNS view
  const unsStructure = React.useMemo(() => {
    const structure: Record<
      string,
      Record<string, Record<string, Record<string, Record<string, Asset[]>>>>
    > = {};

    assets.forEach((asset) => {
      if (!structure[asset.company]) {
        structure[asset.company] = {};
      }
      if (!structure[asset.company][asset.plant]) {
        structure[asset.company][asset.plant] = {};
      }
      if (!structure[asset.company][asset.plant][asset.shop]) {
        structure[asset.company][asset.plant][asset.shop] = {};
      }
      if (!structure[asset.company][asset.plant][asset.shop][asset.line]) {
        structure[asset.company][asset.plant][asset.shop][asset.line] = {};
      }
      if (!structure[asset.company][asset.plant][asset.shop][asset.line][asset.station]) {
        structure[asset.company][asset.plant][asset.shop][asset.line][asset.station] = [];
      }
      structure[asset.company][asset.plant][asset.shop][asset.line][asset.station].push(asset);
    });

    return structure;
  }, [assets]);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (selectedAsset) {
      setSelectedAsset(selectedAsset);
      setStep(2);
      navigate('/create-request/describe');
    }
  };

  const renderUNSTree = () => {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        {Object.entries(unsStructure).map(([company, plants]) => {
          const companyExpanded = expandedNodes.has(company);

          // Count total assets in company
          const companyAssetCount = Object.values(plants).reduce((sum, shops) =>
            sum + Object.values(shops).reduce((sum2, lines) =>
              sum2 + Object.values(lines).reduce((sum3, stations) =>
                sum3 + Object.values(stations).reduce((sum4, assets) =>
                  sum4 + assets.length, 0), 0), 0), 0);

          return (
            <div key={company} className="mb-2">
              {/* Company Level */}
              <div
                onClick={() => toggleNode(company)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                {companyExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                {companyExpanded ? <FolderOpen className="w-5 h-5 text-blue-600" /> : <Folder className="w-5 h-5 text-gray-600" />}
                <span className="font-semibold text-gray-900">{company}</span>
                <span className="text-xs text-gray-500">({companyAssetCount} assets)</span>
              </div>

              {/* Plant Level */}
              {companyExpanded && (
                <div className="ml-6">
                  {Object.entries(plants).map(([plant, shops]) => {
                    const plantId = `${company}/${plant}`;
                    const plantExpanded = expandedNodes.has(plantId);
                    const plantAssetCount = Object.values(shops).reduce((sum, lines) =>
                      sum + Object.values(lines).reduce((sum2, stations) =>
                        sum2 + Object.values(stations).reduce((sum3, assets) =>
                          sum3 + assets.length, 0), 0), 0);

                    return (
                      <div key={plantId} className="mb-2">
                        <div
                          onClick={() => toggleNode(plantId)}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          {plantExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-600" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
                          {plantExpanded ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-gray-500" />}
                          <span className="font-medium text-gray-900">{plant}</span>
                          <span className="text-xs text-gray-500">({plantAssetCount})</span>
                        </div>

                        {/* Shop Level */}
                        {plantExpanded && (
                          <div className="ml-6">
                            {Object.entries(shops).map(([shop, lines]) => {
                              const shopId = `${plantId}/${shop}`;
                              const shopExpanded = expandedNodes.has(shopId);
                              const shopAssetCount = Object.values(lines).reduce((sum, stations) =>
                                sum + Object.values(stations).reduce((sum2, assets) =>
                                  sum2 + assets.length, 0), 0);

                              return (
                                <div key={shopId} className="mb-1">
                                  <div
                                    onClick={() => toggleNode(shopId)}
                                    className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                                  >
                                    {shopExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                                    {shopExpanded ? <FolderOpen className="w-3.5 h-3.5 text-blue-400" /> : <Folder className="w-3.5 h-3.5 text-gray-400" />}
                                    <span className="text-sm text-gray-800">{shop}</span>
                                    <span className="text-xs text-gray-500">({shopAssetCount})</span>
                                  </div>

                                  {/* Line Level */}
                                  {shopExpanded && (
                                    <div className="ml-5">
                                      {Object.entries(lines).map(([line, stations]) => {
                                        const lineId = `${shopId}/${line}`;
                                        const lineExpanded = expandedNodes.has(lineId);
                                        const lineAssetCount = Object.values(stations).reduce((sum, assets) =>
                                          sum + assets.length, 0);

                                        return (
                                          <div key={lineId} className="mb-1">
                                            <div
                                              onClick={() => toggleNode(lineId)}
                                              className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                                            >
                                              {lineExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                                              {lineExpanded ? <FolderOpen className="w-3 h-3 text-blue-300" /> : <Folder className="w-3 h-3 text-gray-300" />}
                                              <span className="text-sm text-gray-700">{line}</span>
                                              <span className="text-xs text-gray-500">({lineAssetCount})</span>
                                            </div>

                                            {/* Station/Equipment Level */}
                                            {lineExpanded && (
                                              <div className="ml-5">
                                                {Object.entries(stations).map(([station, assets]) => {
                                                  const stationId = `${lineId}/${station}`;
                                                  const stationExpanded = expandedNodes.has(stationId);

                                                  return (
                                                    <div key={stationId} className="mb-1">
                                                      <div
                                                        onClick={() => toggleNode(stationId)}
                                                        className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                                                      >
                                                        {stationExpanded ? <ChevronDown className="w-2.5 h-2.5 text-gray-500" /> : <ChevronRight className="w-2.5 h-2.5 text-gray-500" />}
                                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                                                        </svg>
                                                        <span className="text-sm text-gray-700">{station}</span>
                                                        <span className="text-xs text-gray-500">({assets.length})</span>
                                                      </div>

                                                      {/* Equipment/Assets */}
                                                      {stationExpanded && (
                                                        <div className="ml-5 mt-1 space-y-1">
                                                          {assets.map((asset) => (
                                                            <div
                                                              key={asset.id}
                                                              onClick={() => setSelectedAssetId(asset.id)}
                                                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                                                selectedAssetId === asset.id
                                                                  ? 'bg-blue-50 border-l-2 border-l-blue-600'
                                                                  : 'hover:bg-gray-50'
                                                              }`}
                                                            >
                                                              <div className="flex-1">
                                                                <div className="flex items-center space-x-2">
                                                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                                  </svg>
                                                                  <span className="text-xs font-medium text-gray-900">{asset.id}</span>
                                                                  <span className="text-xs text-gray-500">-</span>
                                                                  <span className="text-xs text-gray-700">{asset.name}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 ml-5">{asset.type}</div>
                                                              </div>
                                                              {selectedAssetId === asset.id && (
                                                                <div className="w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center">
                                                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                  </svg>
                                                                </div>
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
        <p className="text-gray-600">Step 1 of 3: Select Asset</p>
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
          <span className="font-medium text-blue-600">Asset</span>
          <span>Describe Data</span>
          <span>Review</span>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Browse:</span>
          <button
            onClick={() => setViewMode('directory')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'directory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Asset Directory
          </button>
          <button
            onClick={() => setViewMode('uns')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'uns'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            UNS Tree
          </button>
        </div>
      </div>

      {/* Asset Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {viewMode === 'directory' ? 'Asset Directory' : 'Unified Namespace (UNS)'}
        </h2>

        {viewMode === 'directory' && (
          <>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by asset ID, name, type, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Asset List */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                    selectedAssetId === asset.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{asset.id}</span>
                        <span className="text-sm text-gray-500">-</span>
                        <span className="text-gray-900">{asset.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {asset.type}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span> {asset.location}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Owner:</span> {asset.owner}
                      </div>
                    </div>
                    {selectedAssetId === asset.id && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {viewMode === 'uns' && (
          <div className="max-h-96 overflow-y-auto">
            {renderUNSTree()}
          </div>
        )}
      </div>

      {/* Selected Asset Details */}
      {selectedAsset && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Selected Asset</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Machine:</span>{' '}
              <span className="text-blue-900">{selectedAsset.id}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Type:</span>{' '}
              <span className="text-blue-900">{selectedAsset.type}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Location:</span>{' '}
              <span className="text-blue-900">{selectedAsset.location}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Will be assigned to:</span>{' '}
              <span className="text-blue-900">{selectedAsset.owner}</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Next step:</strong> You'll describe what data you need from this machine.
          Be specific about which sensors/measurements you need, as machines often have many similar data points.
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
          disabled={!selectedAssetId}
          className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors ${
            selectedAssetId
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
