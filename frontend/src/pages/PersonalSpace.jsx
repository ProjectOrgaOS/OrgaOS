import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import PomodoroTimer from '../components/PomodoroTimer';
import PrivateTodo from '../components/PrivateTodo';

function PersonalSpace() {
  const navigate = useNavigate();
  const [pomodoroMode, setPomodoroMode] = useState('work');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeWidget, setActiveWidget] = useState(null); // 'todo' or 'pomodoro'

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:underline mb-1"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Personal Space</h1>
            {/* Mode indicator - only when timer is running */}
            {isTimerRunning && (
              <span className={`text-xl font-semibold ${
                pomodoroMode === 'work' ? 'text-red-500' : 'text-green-500'
              }`}>
                — {pomodoroMode === 'work' ? 'Work Time' : 'Relax Time'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Layout: Calendar on left, widgets on right */}
      <div className="flex gap-6 items-start">
        {/* Calendar - fixed width */}
        <div className="w-[calc(100%-360px)]">
          <CalendarView />
        </div>

        {/* Right side - fixed width to prevent layout shift */}
        <div className="w-[340px] flex flex-col gap-4 flex-shrink-0">
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
  );
}

export default PersonalSpace;
