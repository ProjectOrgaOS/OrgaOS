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
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('Viewer');

  const columns = ['To Do', 'In Progress', 'Done'];
  const columnIcons = { 'To Do': '📋', 'In Progress': '⚡', 'Done': '✅' };
  const columnColors = {
    'To Do': 'from-blue-500/20 to-blue-600/20',
    'In Progress': 'from-orange-500/20 to-orange-600/20',
    'Done': 'from-green-500/20 to-green-600/20'
  };

  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Join project room for real-time updates (including role changes)
    socket.emit('joinProject', projectId);

    const isSameProject = (taskProject) => String(taskProject) === String(projectId);

    const handleTaskCreated = (task) => {
      if (isSameProject(task.project)) {
        setTasks(prev => prev.some(t => t._id === task._id) ? prev : [...prev, task]);
      }
    };

    const handleTaskUpdated = (task) => {
      if (isSameProject(task.project)) {
        setTasks(prev => prev.map(t => t._id === task._id ? task : t));
      }
    };

    const handleTaskDeleted = ({ taskId, project }) => {
      if (isSameProject(project)) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      }
    };

    // Handle project deleted or being removed from project
    const handleProjectDeleted = ({ projectId: deletedProjectId }) => {
      if (deletedProjectId === projectId) {
        alert('This project has been deleted');
        navigate('/dashboard');
      }
    };

    const handleRemovedFromProject = ({ projectId: removedProjectId }) => {
      if (removedProjectId === projectId) {
        alert('You have been removed from this project');
        navigate('/dashboard');
      }
    };

    // Handle role updates in real-time
    const handleRoleUpdated = ({ projectId: updatedProjectId, userId, newRole }) => {
      if (String(updatedProjectId) === String(projectId)) {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.userId === userId) {
            setCurrentUserRole(newRole);
          }
        }
      }
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);
    socket.on('projectDeleted', handleProjectDeleted);
    socket.on('removedFromProject', handleRemovedFromProject);
    socket.on('memberRoleUpdated', handleRoleUpdated);

    return () => {
      socket.emit('leaveProject', projectId);
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('projectDeleted', handleProjectDeleted);
      socket.off('removedFromProject', handleRemovedFromProject);
      socket.off('memberRoleUpdated', handleRoleUpdated);
    };
  }, [socket, projectId, navigate]);

  const fetchProjectAndTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const projectRes = await fetch(`http://localhost:3000/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const projects = await projectRes.json();
      const currentProject = projects.find(p => p._id === projectId);
      setProject(currentProject);

      const tasksRes = await fetch(`http://localhost:3000/api/tasks/project/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const tasksData = await tasksRes.json();
      if (tasksRes.ok) setTasks(tasksData);

      const membersRes = await fetch(`http://localhost:3000/api/projects/${projectId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const membersData = await membersRes.json();
      if (membersRes.ok) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentMember = membersData.find(m => m._id === payload.userId);
        if (currentMember) setCurrentUserRole(currentMember.role);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

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
    } catch {
      alert('Error connecting to server');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) setTasks(tasks.filter(t => t._id !== taskId));
    } catch {
      alert('Error connecting to server');
    }
    setOpenMenuId(null);
  };

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
      if (response.ok) setTasks(tasks.map(t => t._id === taskId ? data : t));
    } catch {
      alert('Error connecting to server');
    }
    setOpenMenuId(null);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const taskId = draggableId;
    const oldTasks = [...tasks];

    setTasks(prevTasks => prevTasks.map(task =>
      task._id === taskId ? { ...task, status: newStatus } : task
    ));

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
      if (!response.ok) setTasks(oldTasks);
    } catch {
      setTasks(oldTasks);
    }
  };

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
        alert('Invitation sent!');
        setShowInviteModal(false);
        setInviteEmail('');
      } else {
        alert(data.message || 'Failed to send invitation');
      }
    } catch {
      alert('Error connecting to server');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This will delete all tasks and cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete project');
      }
    } catch {
      alert('Error connecting to server');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-white text-lg">Loading board...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-animated">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
                title="Back to Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">{project?.name || 'Project Board'}</h1>
                {project?.description && (
                  <p className="text-white/60 text-sm">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMembersModal(true)}
                className="glass-btn px-4 py-2 rounded-xl text-white font-medium"
                title="View members"
              >
                Members
              </button>
              {currentUserRole === 'Admin' && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="glass-btn px-4 py-2 rounded-xl text-white font-medium"
                >
                  Invite
                </button>
              )}
              {(currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
                <button
                  onClick={() => setShowModal(true)}
                  className="glass-btn-primary px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2"
                >
                  <span>+</span> Add Task
                </button>
              )}
              {currentUserRole === 'Admin' && (
                <button
                  onClick={handleDeleteProject}
                  className="glass-btn px-4 py-2 rounded-xl text-red-300 hover:text-red-100 hover:bg-red-500/20 font-medium transition"
                  title="Delete project"
                >
                  Delete
                </button>
              )}
              <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                currentUserRole === 'Admin' ? 'bg-sky-500/30 text-sky-200' :
                currentUserRole === 'Editor' ? 'bg-blue-500/30 text-blue-200' :
                'bg-white/10 text-white/70'
              }`}>
                {currentUserRole}
              </span>
            </div>
          </div>
        </header>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <div key={column} className={`rounded-2xl p-4 bg-white/10 border border-white/20 shadow-lg bg-gradient-to-br ${columnColors[column]}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{columnIcons[column]}</span>
                    <h2 className="font-bold text-white text-lg">{column}</h2>
                  </div>
                  <span className="bg-white/20 text-white px-2.5 py-1 rounded-lg text-sm font-medium">
                    {getTasksByStatus(column).length}
                  </span>
                </div>

                <Droppable droppableId={column}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[300px] rounded-xl p-2 ${
                        snapshot.isDraggingOver ? 'bg-white/10 ring-2 ring-white/30 ring-dashed' : ''
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
                              style={provided.draggableProps.style}
                              className={`rounded-xl p-4 relative ${
                                snapshot.isDragging
                                  ? 'bg-white shadow-2xl ring-2 ring-sky-400'
                                  : 'glass-white hover:shadow-lg'
                              }`}
                            >
                              {(currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === task._id ? null : task._id);
                                  }}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                                >
                                  ⋮
                                </button>
                              )}

                              {openMenuId === task._id && (currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute top-8 right-2 bg-white border rounded-xl shadow-xl z-20 py-2 min-w-[140px]"
                                >
                                  <p className="px-3 py-1 text-xs text-gray-400 font-semibold">Priority</p>
                                  {['Low', 'Medium', 'High'].map(priority => (
                                    <button
                                      key={priority}
                                      onClick={() => handleUpdatePriority(task._id, priority)}
                                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                        task.priority === priority ? 'font-semibold' : ''
                                      }`}
                                    >
                                      <span className={`w-2 h-2 rounded-full ${
                                        priority === 'Low' ? 'bg-green-500' :
                                        priority === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                      }`} />
                                      {priority}
                                    </button>
                                  ))}
                                  <hr className="my-2" />
                                  <button
                                    onClick={() => handleDeleteTask(task._id)}
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <span>🗑</span> Delete
                                  </button>
                                </div>
                              )}

                              <h3 className="font-semibold text-gray-800 pr-6">{task.title}</h3>
                              {task.description && (
                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{task.description}</p>
                              )}
                              <div className="flex justify-between items-center mt-3">
                                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                                  task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {task.priority}
                                </span>
                                {task.assignee && (
                                  <span className="text-xs text-gray-400">
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
                        <div className="text-white/40 text-center py-8">
                          <p>No tasks</p>
                          <p className="text-xs mt-1">Drag tasks here</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">New Task</h2>

            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/40"
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/40 resize-none"
                  placeholder="Task description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Priority</label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High'].map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setTaskPriority(priority)}
                      className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                        taskPriority === priority
                          ? priority === 'Low' ? 'bg-green-500 text-white' :
                            priority === 'Medium' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          : 'glass-btn text-white/70'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 glass-btn py-3 rounded-xl text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 glass-btn-primary py-3 rounded-xl text-white font-semibold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Invite Member</h2>

            <form onSubmit={handleInvite} className="space-y-5">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/40"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}
                  className="flex-1 glass-btn py-3 rounded-xl text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 glass-btn-primary py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
