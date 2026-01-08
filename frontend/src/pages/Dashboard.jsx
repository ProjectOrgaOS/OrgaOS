import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBox from '../components/NotificationBox';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProjects(data);
      }
    } catch {
      console.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      });
      const data = await response.json();
      if (response.ok) {
        setProjects([...projects, data]);
        setShowModal(false);
        setProjectName('');
        setProjectDescription('');
      } else {
        alert(data.message || 'Failed to create project');
      }
    } catch {
      alert('Error connecting to server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
            <span className="text-white text-lg">Loading projects...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-animated">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-white">My Projects</h1>
            <div className="flex items-center gap-3">
              <NotificationBox onInvitationAccepted={fetchProjects} />
              <button
                onClick={() => navigate('/personal')}
                className="glass-btn px-4 py-2 rounded-xl text-white font-medium"
              >
                My Space
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="glass-btn-primary px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2"
              >
                <span>+</span> New Project
              </button>
              <button
                onClick={handleLogout}
                className="glass-btn px-4 py-2 rounded-xl text-white/70 hover:text-white font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/project/${project._id}`)}
                className="glass rounded-2xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-white/80 text-lg">
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">{project.name}</h2>
                <p className="text-white/60 text-sm line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="mt-4 flex items-center gap-2 text-white/40 text-xs">
                  <span>Click to open</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}

            {/* Add Project Card */}
            <div
              onClick={() => setShowModal(true)}
              className="glass rounded-2xl p-6 cursor-pointer hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 border-2 border-dashed border-white/20 flex flex-col items-center justify-center min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <span className="text-2xl text-white/60">+</span>
              </div>
              <p className="text-white/60 font-medium">Create new project</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="glass rounded-3xl p-12 text-center max-w-md">
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white/40">
                +
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">No projects yet</h2>
              <p className="text-white/60 mb-6">Create your first project to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="glass-btn-primary px-6 py-3 rounded-xl text-white font-semibold"
              >
                Create your first project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">New Project</h2>

            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/40"
                  placeholder="My Awesome Project"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/40 resize-none"
                  placeholder="What is this project about?"
                  rows={3}
                />
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
