import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, User, Request, Message } from '../types';
import { users as initialUsers, assets, templates, requests as initialRequests } from '../data/dummyData';

const AppContext = createContext<AppState | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]); // Default to Maria Lopez (IT)
  const [users] = useState<User[]>(initialUsers);
  const [requests, setRequests] = useState<Request[]>(initialRequests);

  const addRequest = (request: Request) => {
    setRequests((prev) => [...prev, request]);
  };

  const updateRequest = (id: string, updates: Partial<Request>) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, ...updates, updatedAt: new Date().toISOString() } : req))
    );
  };

  const addMessage = (requestId: string, message: Message) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              conversation: [...req.conversation, message],
              updatedAt: new Date().toISOString(),
            }
          : req
      )
    );
  };

  const value: AppState = {
    currentUser,
    users,
    assets,
    templates,
    requests,
    setCurrentUser,
    addRequest,
    updateRequest,
    addMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
