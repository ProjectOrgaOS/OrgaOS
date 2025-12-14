import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSocket } from '../context/SocketContext';
import MembersModal from '../components/MembersModal';

function ProjectBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state for creating tasks
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');

  // Edit menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Members modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('Viewer');

  // Define our 3 columns
  const columns = ['To Do', 'In Progress', 'Done'];

  // Fetch project info and tasks on load
  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Listen for real-time updates from Socket.io
  useEffect(() => {
    if (!socket) return;

    // Helper: compare project IDs (handles ObjectId vs string)
    const isSameProject = (taskProject) => {
      return String(taskProject) === String(projectId);
    };

    // Handle task created by another user
    const handleTaskCreated = (task) => {
      if (isSameProject(task.project)) {
        setTasks(prev => {
          // Avoid duplicates (we already added it locally if we created it)
          if (prev.some(t => t._id === task._id)) return prev;
          return [...prev, task];
        });
      }
    };

    // Handle task updated (status, priority, etc.)
    const handleTaskUpdated = (task) => {
      if (isSameProject(task.project)) {
        setTasks(prev => prev.map(t => t._id === task._id ? task : t));
      }
    };

    // Handle task deleted
    const handleTaskDeleted = ({ taskId, project }) => {
      if (isSameProject(project)) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      }
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);

    // Cleanup: remove listeners when component unmounts
    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
    };
  }, [socket, projectId]);

  const fetchProjectAndTasks = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch project info
      const projectRes = await fetch(`http://localhost:3000/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const projects = await projectRes.json();
      const currentProject = projects.find(p => p._id === projectId);
      setProject(currentProject);

      // Fetch tasks for this project
      const tasksRes = await fetch(`http://localhost:3000/api/tasks/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const tasksData = await tasksRes.json();

      if (tasksRes.ok) {
        setTasks(tasksData);
      }

      // Fetch members to get current user's role
      const membersRes = await fetch(`http://localhost:3000/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const membersData = await membersRes.json();

      if (membersRes.ok) {
        // Get current user ID from token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = payload.userId;
        const currentMember = membersData.find(m => m._id === currentUserId);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks by status for each column
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  // Create a new task
  const handleCreateTask = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          projectId: projectId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTasks([...tasks, data]);
        setShowModal(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('Medium');
      } else {
        alert(data.message || 'Failed to create task');
      }
    } catch (error) {
      alert('Error connecting to server');
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTasks(tasks.filter(t => t._id !== taskId));
      } else {
        alert('Failed to delete task');
      }
    } catch (error) {
      alert('Error connecting to server');
    }
    setOpenMenuId(null);
  };

  // Update task priority
  const handleUpdatePriority = async (taskId, newPriority) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ priority: newPriority }),
      });

      const data = await response.json();

      if (response.ok) {
        setTasks(tasks.map(t => t._id === taskId ? data : t));
      } else {
        alert('Failed to update priority');
      }
    } catch (error) {
      alert('Error connecting to server');
    }
    setOpenMenuId(null);
  };

  // Handle drag end
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;
    const oldTasks = [...tasks];

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task._id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        setTasks(oldTasks);
        console.error('Failed to update task status');
      }
    } catch (error) {
      setTasks(oldTasks);
      console.error('Error updating task:', error);
    }
  };

  // Send invitation to a user
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Invitation sent successfully!');
        setShowInviteModal(false);
        setInviteEmail('');
      } else {
        alert(data.message || 'Failed to send invitation');
      }
    } catch (error) {
      alert('Error connecting to server');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading board...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:underline mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">{project?.name || 'Project Board'}</h1>
          <p className="text-gray-600">{project?.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Members icon */}
          <button
            onClick={() => setShowMembersModal(true)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition"
            title="View members"
          >
            <span className="text-xl">👥</span>
          </button>
          {/* Invite - Admin only */}
          {currentUserRole === 'Admin' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
            >
              Invite
            </button>
          )}
          {/* Add Task - Admin and Editor only */}
          {(currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
            >
              + Add Task
            </button>
          )}
          {/* Show role badge */}
          <span className={`text-xs px-2 py-1 rounded ${
            currentUserRole === 'Admin' ? 'bg-purple-100 text-purple-700' :
            currentUserRole === 'Editor' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {currentUserRole}
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column} className="bg-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">{column}</h2>
                <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-sm">
                  {getTasksByStatus(column).length}
                </span>
              </div>

              <Droppable droppableId={column}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] rounded-lg transition-all duration-200 ${
                      snapshot.isDraggingOver
                        ? 'bg-blue-100 ring-2 ring-blue-300 ring-dashed'
                        : ''
                    }`}
                  >
                    {getTasksByStatus(column).map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                        isDragDisabled={currentUserRole === 'Viewer'}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...(currentUserRole !== 'Viewer' ? provided.dragHandleProps : {})}
                            style={{
                              ...provided.draggableProps.style,
                              transform: snapshot.isDragging
                                ? `${provided.draggableProps.style?.transform || ''} rotate(1.5deg) scale(1.01)`
                                : provided.draggableProps.style?.transform,
                              transition: snapshot.isDropAnimating
                                ? 'all 0.2s ease'
                                : provided.draggableProps.style?.transition,
                            }}
                            className={`bg-white p-4 rounded-lg relative ${
                              snapshot.isDragging
                                ? 'shadow-xl ring-2 ring-blue-400'
                                : 'shadow-sm hover:shadow-md transition-shadow duration-200'
                            }`}
                          >
                            {/* Edit button - Admin and Editor only */}
                            {(currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === task._id ? null : task._id);
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
                              >
                                ⋮
                              </button>
                            )}

                            {/* Dropdown menu */}
                            {openMenuId === task._id && (currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-8 right-2 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[140px]"
                              >
                                <p className="px-3 py-1 text-xs text-gray-500 font-semibold">Priority</p>
                                <button
                                  onClick={() => handleUpdatePriority(task._id, 'Low')}
                                  className={`w-full text-left px-3 py-1 text-sm hover:bg-gray-100 ${task.priority === 'Low' ? 'bg-green-50 text-green-700' : ''}`}
                                >
                                  Low
                                </button>
                                <button
                                  onClick={() => handleUpdatePriority(task._id, 'Medium')}
                                  className={`w-full text-left px-3 py-1 text-sm hover:bg-gray-100 ${task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' : ''}`}
                                >
                                  Medium
                                </button>
                                <button
                                  onClick={() => handleUpdatePriority(task._id, 'High')}
                                  className={`w-full text-left px-3 py-1 text-sm hover:bg-gray-100 ${task.priority === 'High' ? 'bg-red-50 text-red-700' : ''}`}
                                >
                                  High
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            )}

                            <h3 className="font-semibold pr-6">{task.title}</h3>
                            {task.description && (
                              <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                            )}
                            <div className="flex justify-between items-center mt-3">
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  task.priority === 'High'
                                    ? 'bg-red-100 text-red-700'
                                    : task.priority === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {task.priority}
                              </span>
                              {task.assignee && (
                                <span className="text-xs text-gray-500">
                                  {task.assignee.displayName || task.assignee.email}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {getTasksByStatus(column).length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-gray-500 text-center py-4">No tasks</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Add New Task</h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Invite Member</h2>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <MembersModal
          projectId={projectId}
          currentUserRole={currentUserRole}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </div>
  );
}

export default ProjectBoard;
