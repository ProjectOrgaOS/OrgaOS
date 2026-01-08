import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import PomodoroTimer from '../components/PomodoroTimer';
import PrivateTodo from '../components/PrivateTodo';

function PersonalSpace() {
  const navigate = useNavigate();
  const [pomodoroMode, setPomodoroMode] = useState('work');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeWidget, setActiveWidget] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-animated">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
              <h1 className="text-3xl font-bold text-white">Personal Space</h1>
            </div>

            {/* Pomodoro status indicator */}
            {isTimerRunning && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                pomodoroMode === 'work'
                  ? 'bg-red-500/20 text-red-200'
                  : 'bg-green-500/20 text-green-200'
              }`}>
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    pomodoroMode === 'work' ? 'bg-red-400' : 'bg-green-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    pomodoroMode === 'work' ? 'bg-red-500' : 'bg-green-500'
                  }`}></span>
                </span>
                <span className="font-medium">
                  {pomodoroMode === 'work' ? 'Work Time' : 'Relax Time'}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar - takes most space */}
          <div className="flex-1 min-w-0">
            <CalendarView />
          </div>

          {/* Right sidebar - widgets */}
          <div className="w-full lg:w-[340px] flex flex-col gap-4 flex-shrink-0">
            <PrivateTodo
              isActive={activeWidget === 'todo'}
              onFocus={() => setActiveWidget('todo')}
            />
            <PomodoroTimer
              onModeChange={setPomodoroMode}
              onRunningChange={setIsTimerRunning}
              isActive={activeWidget === 'pomodoro'}
              onFocus={() => setActiveWidget('pomodoro')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalSpace;
