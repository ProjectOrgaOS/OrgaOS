import { useState, useEffect, useRef } from 'react';

function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      window.alert('Time is up! Take a break 🍅');
      setIsRunning(false);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for the ring
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-xs mx-auto">
      <h2 className="text-xl font-bold text-center text-gray-700 mb-4">Pomodoro Timer</h2>

      {/* Circular Timer Display */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke={isRunning ? '#ef4444' : '#3b82f6'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={553}
            strokeDashoffset={553 - (553 * progress) / 100}
            className="transition-all duration-1000"
          />
        </svg>

        {/* Time display in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-4xl font-mono font-bold ${isRunning ? 'text-red-500' : 'text-gray-700'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition font-medium"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition font-medium"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition font-medium"
        >
          Reset
        </button>
      </div>

      {/* Quick presets */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => { setTimeLeft(25 * 60); setIsRunning(false); }}
          className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
        >
          25 min
        </button>
        <button
          onClick={() => { setTimeLeft(5 * 60); setIsRunning(false); }}
          className="text-xs px-3 py-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition"
        >
          5 min
        </button>
        <button
          onClick={() => { setTimeLeft(15 * 60); setIsRunning(false); }}
          className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
        >
          15 min
        </button>
      </div>
    </div>
  );
}

export default PomodoroTimer;
