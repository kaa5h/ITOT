import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const EmailInbox: React.FC = () => {
  const navigate = useNavigate();
  const { emails, markEmailRead } = useAppContext();

  // Filter emails for John Smith
  const johnSmithEmail = 'john.smith@company.com';
  const johnSmithEmails = emails.filter(e => e.to === johnSmithEmail);

  const handleOpenRequest = (email: typeof emails[0]) => {
    markEmailRead(email.id);

    if (email.requestId && email.requestToken) {
      const requestUrl = `/request/${email.requestId}/respond?token=${email.requestToken}`;
      navigate(requestUrl);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Mail className="w-7 h-7 mr-3 text-blue-600" />
          John Smith Email - Inbox
        </h1>
        <p className="text-gray-600 mt-1">Demo email inbox for John Smith</p>
      </div>

      {/* Inbox */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {johnSmithEmails.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No emails yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Emails sent to john.smith@company.com will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {johnSmithEmails.map((email) => (
              <div
                key={email.id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !email.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleOpenRequest(email)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Mail
                        className={`w-5 h-5 ${
                          !email.read ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      />
                      <h3
                        className={`text-base font-semibold ${
                          !email.read ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {email.subject}
                      </h3>
                      {!email.read && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">From:</span> {email.from}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {email.body}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(email.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="ml-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRequest(email);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Demo Mode:</strong> This is a simulated email inbox for demonstration purposes.
          In a real system, this would connect to an actual email service.
        </p>
      </div>
    </div>
  );
};

export default EmailInbox;
