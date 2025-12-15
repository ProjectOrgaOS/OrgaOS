import { useState, useEffect, useRef } from 'react';

function PrivateTodo({ isActive, onFocus }) {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');

  // Draggable/resizable state
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 320, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef(null);
  const DRAG_THRESHOLD = 10; // Minimum pixels to move before detaching

  // Load todos from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('privateTodos');
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('privateTodos', JSON.stringify(todos));
  }, [todos]);

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

  // Add new task
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      text: newTask.trim(),
      done: false,
    };

    setTodos([...todos, task]);
    setNewTask('');
  };

  // Toggle task done/undone
  const handleToggle = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  // Delete task
  const handleDelete = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Drag task to calendar
  const handleDragStart = (e, todo) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(todo));
    e.dataTransfer.effectAllowed = 'copy';
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
      className={`bg-white rounded-xl shadow-lg flex flex-col ${position ? 'border border-gray-200' : ''}`}
      style={containerStyle}
      onMouseDown={onFocus}
    >
      {/* Draggable Header */}
      <div
        className="p-3 border-b bg-gray-100 rounded-t-xl cursor-grab select-none flex justify-between items-center"
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-lg font-bold text-gray-700">📝 Private To-Do</h2>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Add task form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          >
            Add
          </button>
        </form>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto">
          {todos.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">No tasks yet</p>
          ) : (
            <ul className="space-y-2">
              {todos.map(todo => (
                <li
                  key={todo.id}
                  draggable={!todo.done}
                  onDragStart={(e) => handleDragStart(e, todo)}
                  className={`flex items-center gap-2 p-2 bg-gray-50 rounded-lg group ${!todo.done ? 'cursor-grab hover:bg-blue-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => handleToggle(todo.id)}
                    className="w-4 h-4 text-blue-500 rounded cursor-pointer"
                  />
                  <span className={`flex-1 text-sm ${todo.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {todo.text}
                  </span>
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-sm"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Counter */}
        {todos.length > 0 && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            {todos.filter(t => t.done).length}/{todos.length} completed
          </p>
        )}
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
  );
}

export default PrivateTodo;
