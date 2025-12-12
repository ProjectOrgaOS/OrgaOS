import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ProjectBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define our 3 columns
  const columns = ['To Do', 'In Progress', 'Done'];

  // Fetch project info and tasks on load
  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId]);

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

  // Loading state
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
      </div>

      {/* Kanban Board - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column} className="bg-gray-200 rounded-lg p-4">
            {/* Column Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">{column}</h2>
              <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-sm">
                {getTasksByStatus(column).length}
              </span>
            </div>

            {/* Tasks in this column */}
            <div className="space-y-3">
              {getTasksByStatus(column).map((task) => (
                <div
                  key={task._id}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <h3 className="font-semibold">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                  )}
                  <div className="flex justify-between items-center mt-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.priority === 'High' ? 'bg-red-100 text-red-700' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                    {task.assignee && (
                      <span className="text-xs text-gray-500">
                        {task.assignee.displayName || task.assignee.email}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {getTasksByStatus(column).length === 0 && (
                <p className="text-gray-500 text-center py-4">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectBoard;
