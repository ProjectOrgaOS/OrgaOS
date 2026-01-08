import { useState, useEffect, useRef } from 'react';

function PomodoroTimer({ onModeChange, onRunningChange, isActive, onFocus }) {
  // Timer modes: 'work' or 'relax'
  const [mode, setMode] = useState('work');
  const [workTime, setWorkTime] = useState(25 * 60); // 25 min default
  const [relaxTime, setRelaxTime] = useState(5 * 60); // 5 min default
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // 'work' or 'relax' or null
  const [editDigits, setEditDigits] = useState('');
  const intervalRef = useRef(null);

  // Draggable/resizable state
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 300, height: 420 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef(null);
  const DRAG_THRESHOLD = 10; // Minimum pixels to move before detaching

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Switch modes
      if (mode === 'work') {
        setMode('relax');
        setTimeLeft(relaxTime);
        onModeChange?.('relax');
      } else {
        setMode('work');
        setTimeLeft(workTime);
        onModeChange?.('work');
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, mode, workTime, relaxTime]);

  // Drag and resize handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        // Check if we've moved past the threshold before detaching
        const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
        const deltaY = Math.abs(e.clientY - dragStartPos.current.y);

        if (!position && (deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD)) {
          return; // Not moved enough yet
        }

        // Detach from layout once threshold is passed
        if (!position) {
          const rect = windowRef.current.getBoundingClientRect();
          setPosition({ x: rect.left, y: rect.top });
          // Capture current size at moment of detach
          setSize({ width: rect.width, height: rect.height });
          dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(280, resizeStart.current.width + (e.clientX - resizeStart.current.x));
        const newHeight = Math.max(350, resizeStart.current.height + (e.clientY - resizeStart.current.y));
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
  }, [isDragging, isResizing, position]);

  const handleMouseDown = (e) => {
    // Store start position for threshold check
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    // Store offset for drag calculation
    if (position) {
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    } else {
      const rect = windowRef.current.getBoundingClientRect();
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    setIsDragging(true);
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

  // Format seconds to H:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Parse H:MM:SS string to seconds
  const parseDigitsToSeconds = (digits) => {
    // Pad to 6 digits (HHMMSS)
    const padded = digits.padStart(6, '0').slice(-6);
    const h = parseInt(padded.slice(0, 2), 10);
    const m = parseInt(padded.slice(2, 4), 10);
    const s = parseInt(padded.slice(4, 6), 10);
    return h * 3600 + m * 60 + s;
  };

  // Format digits being entered to display
  const formatEditDigits = (digits) => {
    const padded = digits.padStart(6, '0').slice(-6);
    const h = padded.slice(0, 2);
    const m = padded.slice(2, 4);
    const s = padded.slice(4, 6);
    return `${parseInt(h, 10)}:${m}:${s}`;
  };

  // Handle digit input
  const handleKeyDown = (e) => {
    if (!isEditing) return;

    if (e.key >= '0' && e.key <= '9') {
      const newDigits = (editDigits + e.key).slice(-6);
      setEditDigits(newDigits);
    } else if (e.key === 'Backspace') {
      setEditDigits(editDigits.slice(0, -1));
    } else if (e.key === 'Enter' || e.key === 'Escape') {
      confirmEdit();
    }
  };

  // Convert seconds to digit string (HHMMSS)
  const secondsToDigits = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}${m.toString().padStart(2, '0')}${s.toString().padStart(2, '0')}`;
  };

  // Start editing time
  const startEdit = (type) => {
    if (isRunning) return;
    // If already editing the same one, confirm and close
    if (isEditing === type) {
      confirmEdit();
      return;
    }
    // If editing another, confirm it first
    if (isEditing && editDigits) {
      const seconds = parseDigitsToSeconds(editDigits);
      if (seconds > 0) {
        if (isEditing === 'work') {
          setWorkTime(seconds);
          if (mode === 'work') setTimeLeft(seconds);
        } else {
          setRelaxTime(seconds);
          if (mode === 'relax') setTimeLeft(seconds);
        }
      }
    }
    setIsEditing(type);
    // Pre-fill with current value
    const currentValue = type === 'work' ? workTime : relaxTime;
    setEditDigits(secondsToDigits(currentValue));
    // Focus the container to capture key events
    windowRef.current?.focus();
  };

  // Confirm edit
  const confirmEdit = () => {
    if (!isEditing) return;

    const seconds = parseDigitsToSeconds(editDigits);
    if (seconds > 0) {
      if (isEditing === 'work') {
        setWorkTime(seconds);
        if (mode === 'work') setTimeLeft(seconds);
      } else {
        setRelaxTime(seconds);
        if (mode === 'relax') setTimeLeft(seconds);
      }
    }
    setIsEditing(null);
    setEditDigits('');
  };

  // Calculate progress
  const totalTime = mode === 'work' ? workTime : relaxTime;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const handleStart = () => {
    // Confirm any pending edit before starting
    if (isEditing && editDigits) {
      const seconds = parseDigitsToSeconds(editDigits);
      if (seconds > 0) {
        if (isEditing === 'work') {
          setWorkTime(seconds);
          if (mode === 'work') setTimeLeft(seconds);
        } else {
          setRelaxTime(seconds);
          if (mode === 'relax') setTimeLeft(seconds);
        }
      }
      setIsEditing(null);
      setEditDigits('');
    }
    setIsRunning(true);
    onRunningChange?.(true);
    onModeChange?.(mode);
  };
  const handlePause = () => {
    setIsRunning(false);
    onRunningChange?.(false);
  };
  const handleReset = () => {
    setIsRunning(false);
    onRunningChange?.(false);
    setTimeLeft(mode === 'work' ? workTime : relaxTime);
  };

  const containerStyle = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isActive ? 50 : 40,
        cursor: isDragging ? 'grabbing' : 'default',
      }
    : { width: `${size.width}px` };

  return (
    <div
      ref={windowRef}
      className={`glass rounded-xl flex flex-col ${position ? 'border border-white/20' : ''}`}
      style={containerStyle}
      onKeyDown={handleKeyDown}
      onMouseDown={onFocus}
      tabIndex={0}
    >
      {/* Draggable Header */}
      <div
        className="p-3 border-b border-white/10 rounded-t-xl cursor-grab select-none flex justify-between items-center"
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-lg font-bold text-white">Pomodoro Timer</h2>
        <span className={`text-xs px-2 py-1 rounded ${mode === 'work' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
          {mode === 'work' ? 'Work' : 'Relax'}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col items-center justify-center">
        {/* Time settings */}
        <div className="flex gap-4 mb-4 text-sm">
          <div
            onClick={() => startEdit('work')}
            className={`text-center cursor-pointer p-2 rounded transition ${isEditing === 'work' ? 'bg-red-500/20 ring-2 ring-red-400' : 'hover:bg-white/10'}`}
          >
            <p className="text-xs text-white/50 mb-1">Work</p>
            <p className={`font-mono font-bold ${mode === 'work' ? 'text-red-400' : 'text-white/60'}`}>
              {isEditing === 'work' ? formatEditDigits(editDigits) : formatTime(workTime)}
            </p>
          </div>
          <div
            onClick={() => startEdit('relax')}
            className={`text-center cursor-pointer p-2 rounded transition ${isEditing === 'relax' ? 'bg-green-500/20 ring-2 ring-green-400' : 'hover:bg-white/10'}`}
          >
            <p className="text-xs text-white/50 mb-1">Relax</p>
            <p className={`font-mono font-bold ${mode === 'relax' ? 'text-green-400' : 'text-white/60'}`}>
              {isEditing === 'relax' ? formatEditDigits(editDigits) : formatTime(relaxTime)}
            </p>
          </div>
        </div>

        {isEditing && (
          <p className="text-xs text-white/40 mb-2">Type digits, Enter to confirm</p>
        )}

        {/* Circular Timer Display */}
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={mode === 'work' ? '#ef4444' : '#22c55e'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={352}
              strokeDashoffset={352 - (352 * progress) / 100}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-mono font-bold ${mode === 'work' ? 'text-red-400' : 'text-green-400'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
            >
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-sm"
            >
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-white/30 hover:text-white/50"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

export default PomodoroTimer;
