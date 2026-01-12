import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, FolderOpen, Folder, X, CheckSquare, Square } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useRequestCreation } from '../../context/RequestCreationContext';
import { Asset } from '../../types';

const AssetSelection: React.FC = () => {
  const navigate = useNavigate();
  const { assets } = useAppContext();
  const { setSelectedAssets, setStep } = useRequestCreation();

  const [viewMode, setViewMode] = useState<'uns' | 'manual'>('uns');
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Manual input state
  const [manualCompany, setManualCompany] = useState('');
  const [manualPlant, setManualPlant] = useState('');
  const [manualShop, setManualShop] = useState('');
  const [manualLine, setManualLine] = useState('');
  const [manualStation, setManualStation] = useState('');

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

  // Get unique values for manual dropdowns
  const companies = React.useMemo(() => [...new Set(assets.map(a => a.company))].sort(), [assets]);
  const plants = React.useMemo(() => {
    if (!manualCompany) return [];
    return [...new Set(assets.filter(a => a.company === manualCompany).map(a => a.plant))].sort();
  }, [assets, manualCompany]);
  const shops = React.useMemo(() => {
    if (!manualCompany || !manualPlant) return [];
    return [...new Set(assets.filter(a => a.company === manualCompany && a.plant === manualPlant).map(a => a.shop))].sort();
  }, [assets, manualCompany, manualPlant]);
  const lines = React.useMemo(() => {
    if (!manualCompany || !manualPlant || !manualShop) return [];
    return [...new Set(assets.filter(a => a.company === manualCompany && a.plant === manualPlant && a.shop === manualShop).map(a => a.line))].sort();
  }, [assets, manualCompany, manualPlant, manualShop]);
  const stations = React.useMemo(() => {
    if (!manualCompany || !manualPlant || !manualShop || !manualLine) return [];
    return [...new Set(assets.filter(a => a.company === manualCompany && a.plant === manualPlant && a.shop === manualShop && a.line === manualLine).map(a => a.station))].sort();
  }, [assets, manualCompany, manualPlant, manualShop, manualLine]);

  // Filter assets based on manual input
  const manualFilteredAssets = React.useMemo(() => {
    return assets.filter(asset => {
      if (manualCompany && asset.company !== manualCompany) return false;
      if (manualPlant && asset.plant !== manualPlant) return false;
      if (manualShop && asset.shop !== manualShop) return false;
      if (manualLine && asset.line !== manualLine) return false;
      if (manualStation && asset.station !== manualStation) return false;
      return true;
    });
  }, [assets, manualCompany, manualPlant, manualShop, manualLine, manualStation]);

  const selectedAssetsList = React.useMemo(() => {
    return assets.filter(a => selectedAssetIds.has(a.id));
  }, [assets, selectedAssetIds]);

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

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const selectAllAssets = (assetsToSelect: Asset[]) => {
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      assetsToSelect.forEach(asset => next.add(asset.id));
      return next;
    });
  };

  const deselectAllAssets = (assetsToDeselect: Asset[]) => {
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      assetsToDeselect.forEach(asset => next.delete(asset.id));
      return next;
    });
  };

  const removeAsset = (assetId: string) => {
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      next.delete(assetId);
      return next;
    });
  };

  const clearAll = () => {
    setSelectedAssetIds(new Set());
  };

  // Helper function to get all assets under a hierarchy level
  const getAssetsForHierarchy = (company?: string, plant?: string, shop?: string, line?: string, station?: string): Asset[] => {
    return assets.filter(asset => {
      if (company && asset.company !== company) return false;
      if (plant && asset.plant !== plant) return false;
      if (shop && asset.shop !== shop) return false;
      if (line && asset.line !== line) return false;
      if (station && asset.station !== station) return false;
      return true;
    });
  };

  const handleNext = () => {
    if (selectedAssetsList.length > 0) {
      setSelectedAssets(selectedAssetsList);
      setStep(2);
      navigate('/create-request/describe');
    }
  };

  const renderUNSTree = () => {
    return (
      <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
        {Object.entries(unsStructure).map(([company, plants]) => {
          const companyExpanded = expandedNodes.has(company);
          const companyAssetCount = Object.values(plants).reduce((sum, shops) =>
            sum + Object.values(shops).reduce((sum2, lines) =>
              sum2 + Object.values(lines).reduce((sum3, stations) =>
                sum3 + Object.values(stations).reduce((sum4, assets) =>
                  sum4 + assets.length, 0), 0), 0), 0);

          const companyAssets = getAssetsForHierarchy(company);
          const allCompanySelected = companyAssets.every(a => selectedAssetIds.has(a.id));

          return (
            <div key={company} className="mb-2">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div
                  onClick={() => toggleNode(company)}
                  className="flex items-center space-x-2 flex-1 cursor-pointer"
                >
                  {companyExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                  {companyExpanded ? <FolderOpen className="w-5 h-5 text-blue-600" /> : <Folder className="w-5 h-5 text-gray-600" />}
                  <span className="font-semibold text-gray-900">{company}</span>
                  <span className="text-xs text-gray-500">({companyAssetCount} assets)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (allCompanySelected) {
                      deselectAllAssets(companyAssets);
                    } else {
                      selectAllAssets(companyAssets);
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                >
                  {allCompanySelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

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
                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div
                            onClick={() => toggleNode(plantId)}
                            className="flex items-center space-x-2 flex-1 cursor-pointer"
                          >
                            {plantExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-600" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
                            {plantExpanded ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-gray-500" />}
                            <span className="font-medium text-gray-900">{plant}</span>
                            <span className="text-xs text-gray-500">({plantAssetCount})</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const plantAssets = getAssetsForHierarchy(company, plant);
                              const allPlantSelected = plantAssets.every(a => selectedAssetIds.has(a.id));
                              if (allPlantSelected) {
                                deselectAllAssets(plantAssets);
                              } else {
                                selectAllAssets(plantAssets);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                          >
                            {(() => {
                              const plantAssets = getAssetsForHierarchy(company, plant);
                              const allPlantSelected = plantAssets.every(a => selectedAssetIds.has(a.id));
                              return allPlantSelected ? 'Deselect All' : 'Select All';
                            })()}
                          </button>
                        </div>

                        {plantExpanded && (
                          <div className="ml-6">
                            {Object.entries(shops).map(([shop, lines]) => {
                              const shopId = `${plantId}/${shop}`;
                              const shopExpanded = expandedNodes.has(shopId);
                              const shopAssetCount = Object.values(lines).reduce((sum, stations) =>
                                sum + Object.values(stations).reduce((sum2, assets) =>
                                  sum2 + assets.length, 0), 0);

                              const shopAssets = getAssetsForHierarchy(company, plant, shop);
                              const allShopSelected = shopAssets.every(a => selectedAssetIds.has(a.id));

                              return (
                                <div key={shopId} className="mb-1">
                                  <div className="flex items-center justify-between p-1.5 hover:bg-gray-50 rounded">
                                    <div
                                      onClick={() => toggleNode(shopId)}
                                      className="flex items-center space-x-2 flex-1 cursor-pointer"
                                    >
                                      {shopExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                                      {shopExpanded ? <FolderOpen className="w-3.5 h-3.5 text-blue-400" /> : <Folder className="w-3.5 h-3.5 text-gray-400" />}
                                      <span className="text-sm text-gray-800">{shop}</span>
                                      <span className="text-xs text-gray-500">({shopAssetCount})</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (allShopSelected) {
                                          deselectAllAssets(shopAssets);
                                        } else {
                                          selectAllAssets(shopAssets);
                                        }
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                                    >
                                      {allShopSelected ? 'Deselect' : 'Select'}
                                    </button>
                                  </div>

                                  {shopExpanded && (
                                    <div className="ml-5">
                                      {Object.entries(lines).map(([line, stations]) => {
                                        const lineId = `${shopId}/${line}`;
                                        const lineExpanded = expandedNodes.has(lineId);
                                        const lineAssetCount = Object.values(stations).reduce((sum, assets) =>
                                          sum + assets.length, 0);

                                        const lineAssets = getAssetsForHierarchy(company, plant, shop, line);
                                        const allLineSelected = lineAssets.every(a => selectedAssetIds.has(a.id));

                                        return (
                                          <div key={lineId} className="mb-1">
                                            <div className="flex items-center justify-between p-1.5 hover:bg-gray-50 rounded">
                                              <div
                                                onClick={() => toggleNode(lineId)}
                                                className="flex items-center space-x-2 flex-1 cursor-pointer"
                                              >
                                                {lineExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                                                {lineExpanded ? <FolderOpen className="w-3 h-3 text-blue-300" /> : <Folder className="w-3 h-3 text-gray-300" />}
                                                <span className="text-sm text-gray-700">{line}</span>
                                                <span className="text-xs text-gray-500">({lineAssetCount})</span>
                                              </div>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (allLineSelected) {
                                                    deselectAllAssets(lineAssets);
                                                  } else {
                                                    selectAllAssets(lineAssets);
                                                  }
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                                              >
                                                {allLineSelected ? 'Deselect' : 'Select'}
                                              </button>
                                            </div>

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

                                                      {stationExpanded && (
                                                        <div className="ml-5 mt-1">
                                                          {/* Select All button for station */}
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              const allSelected = assets.every(a => selectedAssetIds.has(a.id));
                                                              if (allSelected) {
                                                                deselectAllAssets(assets);
                                                              } else {
                                                                selectAllAssets(assets);
                                                              }
                                                            }}
                                                            className="text-xs text-blue-600 hover:text-blue-800 mb-1 px-2"
                                                          >
                                                            {assets.every(a => selectedAssetIds.has(a.id)) ? 'Deselect All' : 'Select All'} ({assets.length})
                                                          </button>
                                                          <div className="space-y-1">
                                                            {assets.map((asset) => (
                                                              <div
                                                                key={asset.id}
                                                                onClick={() => toggleAssetSelection(asset.id)}
                                                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                                                  selectedAssetIds.has(asset.id)
                                                                    ? 'bg-blue-50 border-l-2 border-l-blue-600'
                                                                    : 'hover:bg-gray-50'
                                                                }`}
                                                              >
                                                                <div className="flex items-center space-x-2 flex-1">
                                                                  {selectedAssetIds.has(asset.id) ? (
                                                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                                                  ) : (
                                                                    <Square className="w-4 h-4 text-gray-400" />
                                                                  )}
                                                                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                                                  </svg>
                                                                  <div className="flex-1">
                                                                    <div className="flex items-center space-x-2">
                                                                      <span className="text-xs font-medium text-gray-900">{asset.id}</span>
                                                                      <span className="text-xs text-gray-500">-</span>
                                                                      <span className="text-xs text-gray-700">{asset.name}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{asset.type}</div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            ))}
                                                          </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Request</h1>
            <p className="text-gray-600">Step 1 of 3: Select Assets</p>
          </div>
          {selectedAssetsList.length > 0 && (
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              <span className="font-semibold">{selectedAssetsList.length}</span> selected
            </div>
          )}
        </div>
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
            onClick={() => setViewMode('uns')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'uns'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            UNS Tree
          </button>
          <button
            onClick={() => setViewMode('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manual Input
          </button>
        </div>
      </div>

      {/* Asset Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {viewMode === 'uns' ? 'Unified Namespace (UNS)' : 'Manual Asset Path'}
        </h2>

        {viewMode === 'uns' ? (
          renderUNSTree()
        ) : (
          <div className="space-y-4">
            {/* Manual Input Form */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  value={manualCompany}
                  onChange={(e) => {
                    setManualCompany(e.target.value);
                    setManualPlant('');
                    setManualShop('');
                    setManualLine('');
                    setManualStation('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select company...</option>
                  {companies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {manualCompany && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plant</label>
                  <select
                    value={manualPlant}
                    onChange={(e) => {
                      setManualPlant(e.target.value);
                      setManualShop('');
                      setManualLine('');
                      setManualStation('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select plant...</option>
                    {plants.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {manualCompany && manualPlant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
                  <select
                    value={manualShop}
                    onChange={(e) => {
                      setManualShop(e.target.value);
                      setManualLine('');
                      setManualStation('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select shop...</option>
                    {shops.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {manualCompany && manualPlant && manualShop && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Line</label>
                  <select
                    value={manualLine}
                    onChange={(e) => {
                      setManualLine(e.target.value);
                      setManualStation('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select line...</option>
                    {lines.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              )}

              {manualCompany && manualPlant && manualShop && manualLine && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                  <select
                    value={manualStation}
                    onChange={(e) => {
                      setManualStation(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select station...</option>
                    {stations.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Show matching assets */}
            {manualCompany && manualFilteredAssets.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Matching Assets ({manualFilteredAssets.length})
                  </h3>
                  <button
                    onClick={() => {
                      const allSelected = manualFilteredAssets.every(a => selectedAssetIds.has(a.id));
                      if (allSelected) {
                        deselectAllAssets(manualFilteredAssets);
                      } else {
                        selectAllAssets(manualFilteredAssets);
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {manualFilteredAssets.every(a => selectedAssetIds.has(a.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {manualFilteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => toggleAssetSelection(asset.id)}
                      className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                        selectedAssetIds.has(asset.id)
                          ? 'bg-blue-50 border-l-4 border-l-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {selectedAssetIds.has(asset.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Assets Panel */}
      {selectedAssetsList.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900">
              Selected Assets ({selectedAssetsList.length})
            </h3>
            <button
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedAssetsList.map((asset) => (
              <div
                key={asset.id}
                className="bg-white border border-blue-200 rounded p-3 flex items-start justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{asset.id}</span>
                    <span className="text-xs text-gray-500">-</span>
                    <span className="text-sm text-gray-700 truncate">{asset.name}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {asset.type} • {asset.location}
                  </div>
                  <div className="text-xs text-blue-700">
                    Will be assigned to: {asset.owner}
                  </div>
                </div>
                <button
                  onClick={() => removeAsset(asset.id)}
                  className="ml-3 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove asset"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Next step:</strong> You'll describe what data you need from{' '}
          {selectedAssetsList.length === 1 ? 'this machine' : `these ${selectedAssetsList.length} machines`}.
          {selectedAssetsList.length > 1 && ' The same data requirements will apply to all selected assets.'}
        </p>
        <p className="text-xs text-amber-700 mt-2">
          <strong>Tip:</strong> Select multiple assets when they share the same data needs (e.g., all PLCs in Line 1).
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
          disabled={selectedAssetsList.length === 0}
          className={`inline-flex items-center px-6 py-2 rounded-lg transition-colors ${
            selectedAssetsList.length > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next: Describe Data{selectedAssetsList.length > 1 && ` (${selectedAssetsList.length} assets)`}
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default AssetSelection;
