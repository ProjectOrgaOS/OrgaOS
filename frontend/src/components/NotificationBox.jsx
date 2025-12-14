import { useState, useEffect } from 'react';

function NotificationBox({ onInvitationAccepted }) {
  const [invitations, setInvitations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch invitations on mount
  useEffect(() => {
    fetchInvitations();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification-box')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/users/invitations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setInvitations(data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleRespond = async (projectId, accept) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/users/invitations/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, accept }),
      });

      if (response.ok) {
        // Remove from local state
        setInvitations(prev => prev.filter(inv => inv.projectId !== projectId));

        // If accepted, notify parent to refresh projects
        if (accept && onInvitationAccepted) {
          onInvitationAccepted();
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-box relative">
      {/* Bell Icon Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition"
      >
        <span className="text-xl">🔔</span>

        {/* Red badge with count */}
        {invitations.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {invitations.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-gray-700">Invitations</h3>
          </div>

          {invitations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No pending invitations
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {invitations.map((inv) => (
                <div key={inv.projectId} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                  <p className="font-medium text-gray-800">{inv.projectName}</p>
                  <p className="text-sm text-gray-500">
                    Invited by {inv.inviterName}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleRespond(inv.projectId, true)}
                      disabled={loading}
                      className="flex-1 bg-green-500 text-white text-sm py-1 px-3 rounded hover:bg-green-600 transition disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(inv.projectId, false)}
                      disabled={loading}
                      className="flex-1 bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600 transition disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBox;
