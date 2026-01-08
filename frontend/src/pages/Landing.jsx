import { useNavigate } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Kanban Boards',
      description: 'Drag-and-drop your tasks between columns to track progress'
    },
    {
      title: 'Team Collaboration',
      description: 'Work together with role-based access control'
    },
    {
      title: 'Personal Calendar',
      description: 'Keep track of your events and deadlines'
    },
    {
      title: 'Pomodoro Timer',
      description: 'Built-in timer to help you stay focused'
    },
    {
      title: 'Real-time Sync',
      description: 'Changes appear instantly for all team members'
    },
    {
      title: 'Secure',
      description: 'JWT-based authentication to protect your data'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-animated">
      {/* Decorative circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-2xl font-bold text-white">OrgaOS</span>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="glass-btn px-5 py-2 rounded-xl text-white font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="glass-btn-primary px-5 py-2 rounded-xl text-white font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Manage your projects,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-cyan-200">
              stay organized
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            OrgaOS brings together task boards, calendars, and productivity tools
            in one place. Perfect for teams and personal use.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="glass-btn-primary px-8 py-4 rounded-2xl text-white font-semibold text-lg flex items-center gap-2"
            >
              Start for free
              <span>→</span>
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView()}
              className="glass-btn px-8 py-4 rounded-2xl text-white font-medium text-lg"
            >
              Learn more
            </button>
          </div>
        </div>

        {/* Hero Image/Preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="glass rounded-3xl p-2 shadow-2xl">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 aspect-video flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
                {/* Kanban Preview */}
                <div className="glass rounded-xl p-3">
                  <div className="text-white/60 text-xs mb-2">To Do</div>
                  <div className="space-y-2">
                    <div className="bg-blue-500/30 rounded-lg p-2 text-white text-xs">Design UI</div>
                    <div className="bg-blue-500/30 rounded-lg p-2 text-white text-xs">Setup API</div>
                  </div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="text-white/60 text-xs mb-2">In Progress</div>
                  <div className="space-y-2">
                    <div className="bg-orange-500/30 rounded-lg p-2 text-white text-xs">Build components</div>
                  </div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="text-white/60 text-xs mb-2">Done</div>
                  <div className="space-y-2">
                    <div className="bg-green-500/30 rounded-lg p-2 text-white text-xs">Project setup</div>
                    <div className="bg-green-500/30 rounded-lg p-2 text-white text-xs">Database</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              What is included
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              All the tools you need to manage your projects and stay on track
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to try it out?
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Create your account and start organizing your projects today
            </p>
            <button
              onClick={() => navigate('/register')}
              className="glass-btn-primary px-10 py-4 rounded-2xl text-white font-semibold text-lg"
            >
              Create an account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-white font-semibold">OrgaOS</span>
          <p className="text-white/50 text-sm">
            CDOF5.6
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
