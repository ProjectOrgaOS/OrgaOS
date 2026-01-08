import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSocket } from '../context/SocketContext';

function NotificationBox({ onInvitationAccepted }) {
  const [invitations, setInvitations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const socket = useSocket();

  useEffect(() => {
    fetchInvitations();
  }, []);

  // Listen for real-time invitation events
  useEffect(() => {
    if (!socket) return;

    const handleNewInvitation = (invitation) => {
      setInvitations(prev => [...prev, invitation]);
    };

    socket.on('newInvitation', handleNewInvitation);

    return () => {
      socket.off('newInvitation', handleNewInvitation);
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification-box') && !e.target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Drag handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e) => {
    if (position) {
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
    setIsDragging(true);
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/users/invitations', {
        headers: { 'Authorization': `Bearer ${token}` },
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
        setInvitations(prev => prev.filter(inv => inv.projectId !== projectId));
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

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        x: rect.right - 320,
        y: rect.bottom + 8
      });
    }
    setIsOpen(!isOpen);
  };

  const dropdown = isOpen && (
    <div
      className="notification-dropdown"
      style={{
        position: 'fixed',
        left: position?.x || 0,
        top: position?.y || 0,
        zIndex: 99999,
      }}
    >
      <div className="w-80 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Draggable header */}
        <div
          className="p-4 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDragStart}
        >
          <h3 className="font-semibold text-white">Invitations</h3>
        </div>

        {invitations.length === 0 ? (
          <div className="p-6 text-center text-white/60">
            No pending invitations
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {invitations.map((inv) => (
              <div key={inv.projectId} className="p-4 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition">
                <p className="font-medium text-white">{inv.projectName}</p>
                <p className="text-sm text-white/60">
                  Invited by {inv.inviterName}
                </p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleRespond(inv.projectId, true)}
                    disabled={loading}
                    className="flex-1 bg-green-500/80 hover:bg-green-500 text-white text-sm py-1.5 px-3 rounded-lg transition disabled:opacity-50 font-medium"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(inv.projectId, false)}
                    disabled={loading}
                    className="flex-1 bg-red-500/80 hover:bg-red-500 text-white text-sm py-1.5 px-3 rounded-lg transition disabled:opacity-50 font-medium"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="notification-box relative">
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative glass-btn p-2 rounded-xl text-white transition"
      >
        <span className="text-xl">🔔</span>

        {/* Badge with count */}
        {invitations.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium animate-pulse">
            {invitations.length}
          </span>
        )}
      </button>

      {/* Render dropdown via portal to escape stacking context */}
      {createPortal(dropdown, document.body)}
    </div>
  );
}

export default NotificationBox;
