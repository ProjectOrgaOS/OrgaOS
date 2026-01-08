import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

function MembersModal({ projectId, onClose, currentUserRole }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  // Window size and position state
  const [size, setSize] = useState({ width: 400, height: 450 });
  const [position, setPosition] = useState(null); // null = not yet centered
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef(null);

  // Center window on mount
  useEffect(() => {
    const centerX = (window.innerWidth - size.width) / 2;
    const centerY = (window.innerHeight - size.height) / 2;
    setPosition({ x: centerX, y: Math.max(50, centerY) });
  }, []);

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  // Listen for real-time role updates and member removal
  useEffect(() => {
    if (!socket) return;

    const handleRoleUpdated = ({ projectId: updatedProjectId, userId, newRole }) => {
      if (String(updatedProjectId) === String(projectId)) {
        setMembers(prev =>
          prev.map(m => (String(m._id) === String(userId) ? { ...m, role: newRole } : m))
        );
      }
    };

    const handleMemberRemoved = ({ projectId: updatedProjectId, userId }) => {
      if (String(updatedProjectId) === String(projectId)) {
        setMembers(prev => prev.filter(m => String(m._id) !== String(userId)));
      }
    };

    socket.on('memberRoleUpdated', handleRoleUpdated);
    socket.on('memberRemoved', handleMemberRemoved);

    return () => {
      socket.off('memberRoleUpdated', handleRoleUpdated);
      socket.off('memberRemoved', handleMemberRemoved);
    };
  }, [socket, projectId]);

  // Handle drag and resize events
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(300, resizeStart.current.width + (e.clientX - resizeStart.current.x));
        const newHeight = Math.max(250, resizeStart.current.height + (e.clientY - resizeStart.current.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const handleMouseDown = (e) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
    }
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
    setIsResizing(true);
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    // Optimistic update - update UI immediately
    setMembers(prev =>
      prev.map(m => (String(m._id) === String(userId) ? { ...m, role: newRole } : m))
    );

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/projects/${projectId}/members/${userId}/role`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        // Revert on failure - refetch members
        const data = await response.json();
        alert(data.message || 'Failed to update role');
        fetchMembers();
      }
    } catch {
      alert('Error connecting to server');
      fetchMembers();
    }
  };

  const handleKickMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    // Optimistic update
    const previousMembers = members;
    setMembers(prev => prev.filter(m => String(m._id) !== String(userId)));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/projects/${projectId}/members/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || 'Failed to remove member');
        setMembers(previousMembers);
      }
    } catch {
      alert('Error connecting to server');
      setMembers(previousMembers);
    }
  };

  // Role badge colors (night theme)
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-sky-500/30 text-sky-200';
      case 'Editor':
        return 'bg-blue-500/30 text-blue-200';
      case 'Viewer':
        return 'bg-white/10 text-white/70';
      default:
        return 'bg-white/10 text-white/70';
    }
  };

  const isAdmin = currentUserRole === 'Admin';

  // Don't render until position is calculated
  if (!position) return null;

  return (
    <div
      ref={windowRef}
      className="fixed glass rounded-2xl shadow-2xl z-50 border border-white/20 flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'default',
      }}
    >
      {/* Draggable Header */}
      <div
        className="flex justify-between items-center p-4 border-b border-white/10 cursor-grab select-none"
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-xl font-bold text-white">Project Members</h2>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-2xl leading-none transition"
          onMouseDown={(e) => e.stopPropagation()}
        >
          ×
        </button>
      </div>

      {/* Members list */}
      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-white/60">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-center text-white/60">No members found</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {(member.displayName || member.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {member.displayName || member.email}
                      {member.isOwner && (
                        <span className="ml-2 text-xs text-yellow-400">Owner</span>
                      )}
                    </p>
                    <p className="text-sm text-white/50">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role selector or badge */}
                  {isAdmin && !member.isOwner ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      className={`text-sm px-3 py-1 rounded-lg border border-white/20 cursor-pointer bg-white/10 ${getRoleBadgeClass(member.role)}`}
                    >
                      <option value="Admin" className="bg-gray-800">Admin</option>
                      <option value="Editor" className="bg-gray-800">Editor</option>
                      <option value="Viewer" className="bg-gray-800">Viewer</option>
                    </select>
                  ) : (
                    <span className={`text-sm px-3 py-1 rounded-lg ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                  )}

                  {/* Kick button (Admin only, not for owner) */}
                  {isAdmin && !member.isOwner && (
                    <button
                      onClick={() => handleKickMember(member._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1.5 rounded-lg transition"
                      title="Remove member"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with legend */}
      <div className="p-3 border-t border-white/10 relative">
        <p className="text-xs text-white/40 mb-1">Role permissions:</p>
        <div className="flex gap-4 text-xs text-white/60">
          <span><strong className="text-sky-300">Admin:</strong> Full control</span>
          <span><strong className="text-blue-300">Editor:</strong> Edit tasks</span>
          <span><strong className="text-white/70">Viewer:</strong> Read-only</span>
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-white/30 hover:text-white/60"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default MembersModal;
