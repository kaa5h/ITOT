import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Asset } from '../types';

interface RequestCreationState {
  step: number;
  selectedAsset?: Asset; // Kept for backward compatibility
  selectedAssets: Asset[]; // NEW: Support multiple assets
  description: string;
  timeline: string;
  estimatedDataPoints: string;
}

interface RequestCreationContextType extends RequestCreationState {
  setStep: (step: number) => void;
  setSelectedAsset: (asset: Asset) => void; // Kept for backward compatibility
  setSelectedAssets: (assets: Asset[]) => void; // NEW: Set multiple assets
  setDescription: (description: string) => void;
  setTimeline: (timeline: string) => void;
  setEstimatedDataPoints: (count: string) => void;
  resetState: () => void;
}

const RequestCreationContext = createContext<RequestCreationContextType | undefined>(undefined);

export const useRequestCreation = () => {
  const context = useContext(RequestCreationContext);
  if (!context) {
    throw new Error('useRequestCreation must be used within RequestCreationProvider');
  }
  return context;
};

const initialState: RequestCreationState = {
  step: 1,
  selectedAssets: [],
  description: '',
  timeline: '',
  estimatedDataPoints: '1-5',
};

export const RequestCreationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RequestCreationState>(initialState);

  const value: RequestCreationContextType = {
    ...state,
    setStep: (step) => setState((prev) => ({ ...prev, step })),
    setSelectedAsset: (selectedAsset) => setState((prev) => ({
      ...prev,
      selectedAsset,
      selectedAssets: [selectedAsset] // Backward compatibility
    })),
    setSelectedAssets: (selectedAssets) => setState((prev) => ({
      ...prev,
      selectedAssets,
      selectedAsset: selectedAssets[0] // Set first as primary for backward compatibility
    })),
    setDescription: (description) => setState((prev) => ({ ...prev, description })),
    setTimeline: (timeline) => setState((prev) => ({ ...prev, timeline })),
    setEstimatedDataPoints: (estimatedDataPoints) => setState((prev) => ({ ...prev, estimatedDataPoints })),
    resetState: () => setState(initialState),
  };

  return (
    <RequestCreationContext.Provider value={value}>
      {children}
    </RequestCreationContext.Provider>
  );
};
