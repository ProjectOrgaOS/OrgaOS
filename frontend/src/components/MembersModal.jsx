import { useState, useEffect, useRef } from 'react';

function MembersModal({ projectId, onClose, currentUserRole }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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

      if (response.ok) {
        // Update local state
        setMembers(prev =>
          prev.map(m => (m._id === userId ? { ...m, role: newRole } : m))
        );
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update role');
      }
    } catch (error) {
      alert('Error connecting to server');
    }
  };

  // Role badge colors
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700';
      case 'Editor':
        return 'bg-blue-100 text-blue-700';
      case 'Viewer':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isAdmin = currentUserRole === 'Admin';

  // Don't render until position is calculated
  if (!position) return null;

  return (
    <div
      ref={windowRef}
      className="fixed bg-white rounded-lg shadow-2xl z-50 border border-gray-200 flex flex-col"
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
        className="flex justify-between items-center p-4 border-b bg-gray-100 rounded-t-lg cursor-grab select-none"
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-xl font-bold">Project Members</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          onMouseDown={(e) => e.stopPropagation()}
        >
          ×
        </button>
      </div>

      {/* Members list */}
      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-center text-gray-500">No members found</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {(member.displayName || member.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.displayName || member.email}
                      {member.isOwner && (
                        <span className="ml-2 text-xs text-yellow-600">Owner</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                {/* Role selector or badge */}
                {isAdmin && !member.isOwner ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member._id, e.target.value)}
                    className={`text-sm px-3 py-1 rounded border cursor-pointer ${getRoleBadgeClass(member.role)}`}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                ) : (
                  <span className={`text-sm px-3 py-1 rounded ${getRoleBadgeClass(member.role)}`}>
                    {member.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with legend */}
      <div className="p-3 border-t bg-gray-50 rounded-b-lg relative">
        <p className="text-xs text-gray-500 mb-1">Role permissions:</p>
        <div className="flex gap-4 text-xs">
          <span><strong>Admin:</strong> Full control</span>
          <span><strong>Editor:</strong> Edit tasks</span>
          <span><strong>Viewer:</strong> Read-only</span>
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-gray-400 hover:text-gray-600"
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
