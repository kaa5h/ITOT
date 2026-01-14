import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, User, Request, Message, Notification, Email } from '../types';
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
  // Migrate old requests to include statusHistory
  const migrateRequest = (req: any): Request => {
    if (!req.statusHistory) {
      return {
        ...req,
        statusHistory: [{
          id: 'history-initial',
          status: req.status,
          timestamp: req.createdAt,
          changedBy: req.createdBy,
          note: 'Request created'
        }]
      };
    }
    return req;
  };

  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]); // Default to Maria Lopez (IT)
  const [users] = useState<User[]>(initialUsers);
  const [requests, setRequests] = useState<Request[]>(initialRequests.map(migrateRequest));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emails, setEmails] = useState<Email[]>([]); // Demo email inbox

  const addRequest = (request: Request) => {
    setRequests((prev) => [...prev, request]);

    // Create notification for assigned OT user
    const notification: Notification = {
      id: 'notif-' + Date.now(),
      type: 'request_assigned',
      requestId: request.id,
      requestName: request.assetName,
      message: `${request.createdBy} assigned you a new request for ${request.assetName}`,
      from: request.createdBy,
      to: request.assignedTo,
      timestamp: new Date().toISOString(),
      read: false,
      link: `/request/${request.id}/respond`,
    };
    console.log('[AppContext] Creating notification for request assignment:', notification);
    setNotifications((prev) => {
      const updated = [notification, ...prev];
      console.log('[AppContext] Updated notifications:', updated);
      return updated;
    });
  };

  const updateRequest = (id: string, updates: Partial<Request>) => {
    setRequests((prev) => {
      const oldRequest = prev.find(r => r.id === id);
      const updatedRequests = prev.map((req) =>
        req.id === id ? { ...req, ...updates, updatedAt: new Date().toISOString() } : req
      );

      // Create notification for status changes
      if (oldRequest && updates.status && updates.status !== oldRequest.status) {
        const newRequest = updatedRequests.find(r => r.id === id)!;
        let notificationTo = '';
        let notificationMessage = '';
        let notificationType: 'status_changed' | 'request_submitted' = 'status_changed';
        let link = '';

        // OT submits to IT for review
        if (updates.status === 'review') {
          notificationTo = newRequest.createdBy;
          notificationMessage = `${newRequest.assignedTo} submitted ${newRequest.assetName} for your review`;
          notificationType = 'request_submitted';
          link = `/request/${id}/review`;
        }
        // IT or other status changes back to OT
        else if (oldRequest.status === 'review' || updates.status === 'blocked') {
          notificationTo = newRequest.assignedTo;
          notificationMessage = `Status changed to ${updates.status} for ${newRequest.assetName}`;
          link = `/request/${id}/respond`;
        }

        if (notificationTo) {
          const notification: Notification = {
            id: 'notif-' + Date.now(),
            type: notificationType,
            requestId: id,
            requestName: newRequest.assetName,
            message: notificationMessage,
            from: currentUser.name,
            to: notificationTo,
            timestamp: new Date().toISOString(),
            read: false,
            link,
          };
          setNotifications((prev) => [notification, ...prev]);
        }
      }

      return updatedRequests;
    });
  };

  const addMessage = (requestId: string, message: Message) => {
    setRequests((prev) => {
      const request = prev.find(r => r.id === requestId);
      const updatedRequests = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              conversation: [...req.conversation, message],
              updatedAt: new Date().toISOString(),
            }
          : req
      );

      // Create notification for new comment
      if (request) {
        const notificationTo = message.from === request.createdBy ? request.assignedTo : request.createdBy;
        const notification: Notification = {
          id: 'notif-' + Date.now(),
          type: 'new_comment',
          requestId: request.id,
          requestName: request.assetName,
          message: `${message.from} commented on ${request.assetName}`,
          from: message.from,
          to: notificationTo,
          timestamp: new Date().toISOString(),
          read: false,
          link: `/request/${requestId}/respond`,
        };
        setNotifications((prev) => [notification, ...prev]);
      }

      return updatedRequests;
    });
  };

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.to === currentUser.name ? { ...notif, read: true } : notif))
    );
  };

  const addEmail = (email: Email) => {
    setEmails((prev) => [email, ...prev]);
  };

  const markEmailRead = (id: string) => {
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, read: true } : email))
    );
  };

  const value: AppState = {
    currentUser,
    users,
    assets,
    templates,
    requests,
    notifications,
    emails,
    setCurrentUser,
    addRequest,
    updateRequest,
    addMessage,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    addEmail,
    markEmailRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
