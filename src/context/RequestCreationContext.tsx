import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Asset, Connection, Endpoint } from '../types';

interface RequestCreationState {
  step: number;
  selectedAsset?: Asset;
  context: string;
  connection: Connection;
  endpoints: Endpoint[];
  templateId?: string;
}

interface RequestCreationContextType extends RequestCreationState {
  setStep: (step: number) => void;
  setSelectedAsset: (asset: Asset) => void;
  setContext: (context: string) => void;
  setConnection: (connection: Connection) => void;
  setEndpoints: (endpoints: Endpoint[]) => void;
  setTemplateId: (id: string) => void;
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
  context: '',
  connection: { protocol: '', host: '', port: 502 },
  endpoints: [],
};

export const RequestCreationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RequestCreationState>(initialState);

  const value: RequestCreationContextType = {
    ...state,
    setStep: (step) => setState((prev) => ({ ...prev, step })),
    setSelectedAsset: (selectedAsset) => setState((prev) => ({ ...prev, selectedAsset })),
    setContext: (context) => setState((prev) => ({ ...prev, context })),
    setConnection: (connection) => setState((prev) => ({ ...prev, connection })),
    setEndpoints: (endpoints) => setState((prev) => ({ ...prev, endpoints })),
    setTemplateId: (templateId) => setState((prev) => ({ ...prev, templateId })),
    resetState: () => setState(initialState),
  };

  return (
    <RequestCreationContext.Provider value={value}>
      {children}
    </RequestCreationContext.Provider>
  );
};
