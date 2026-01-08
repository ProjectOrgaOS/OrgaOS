import { useState, useEffect, useRef } from 'react';

function CalendarView() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/events', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setEvents(data.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const createEvent = async (title, date) => {
    try {
      const token = localStorage.getItem('token');
      const start = new Date(date);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const response = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          start: start.toISOString(),
          end: end.toISOString(),
          allDay: false,
        }),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents(prev => [...prev, { ...newEvent, start: new Date(newEvent.start), end: new Date(newEvent.end) }]);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setEvents(prev => prev.filter(e => e._id !== eventId));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const updateEventDate = async (eventId, newDate) => {
    try {
      const token = localStorage.getItem('token');
      const start = new Date(newDate);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ start: start.toISOString(), end: end.toISOString() }),
      });

      if (response.ok) {
        const updated = await response.json();
        setEvents(prev => prev.map(e =>
          e._id === eventId ? { ...updated, start: new Date(updated.start), end: new Date(updated.end) } : e
        ));
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const updateEventStatus = async (eventId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setEvents(prev => prev.map(e =>
          e._id === eventId ? { ...updated, start: new Date(updated.start), end: new Date(updated.end) } : e
        ));
      }
    } catch (error) {
      console.error('Error updating event status:', error);
    }
    setOpenMenuId(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return 'bg-orange-500 hover:bg-orange-600';
      case 'Done': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(e => {
      const eventDate = new Date(e.start);
      return eventDate.getFullYear() === year &&
             eventDate.getMonth() === month &&
             eventDate.getDate() === day;
    });
  };

  // Check if a day is today
  const isToday = (day) => {
    const today = new Date();
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day;
  };

  // Handle drop on a day cell (new todo or moving existing event)
  const handleDrop = (e, day) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    try {
      const item = JSON.parse(data);
      const dropDate = new Date(year, month, day);

      if (item.type === 'event') {
        updateEventDate(item._id, dropDate);
      } else {
        createEvent(item.text, dropDate);
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  };

  // Handle event drag start
  const handleEventDragStart = (e, event) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'event', _id: event._id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Build calendar grid
  const calendarDays = [];

  // Empty cells before first day
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="bg-white/5 border border-white/10 min-h-0" />
    );
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const today = isToday(day);

    calendarDays.push(
      <div
        key={day}
        className={`border border-white/10 p-1 overflow-hidden hover:bg-white/10 transition cursor-pointer min-h-0 flex flex-col ${
          today ? 'bg-sky-500/20' : 'bg-white/5'
        }`}
        onDrop={(e) => handleDrop(e, day)}
        onDragOver={handleDragOver}
      >
        <div className={`text-xs font-semibold mb-1 ${today ? 'text-sky-300' : 'text-white/60'}`}>
          {day}
        </div>
        <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0">
          {dayEvents.map(event => (
            <div
              key={event._id}
              className="relative"
            >
              <div
                draggable
                onDragStart={(e) => handleEventDragStart(e, event)}
                className={`text-xs text-white px-1 py-0.5 rounded truncate cursor-grab active:cursor-grabbing transition flex items-center justify-between gap-1 ${getStatusColor(event.status)}`}
                title={event.title}
              >
                <span className="truncate">{event.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuPosition({ x: rect.right, y: rect.bottom + 4 });
                    setOpenMenuId(openMenuId === event._id ? null : event._id);
                  }}
                  className="flex-shrink-0 hover:bg-white/20 rounded px-0.5"
                >
                  ⋮
                </button>
              </div>
              {openMenuId === event._id && (
                <div
                  ref={menuRef}
                  style={{ top: menuPosition.y, left: menuPosition.x - 140 }}
                  className="fixed bg-slate-800 rounded-lg shadow-xl border border-white/20 py-1 z-[9999] min-w-[140px]"
                >
                  <div className="px-2 py-1 text-xs text-white/50 font-semibold">Status</div>
                  {['To Do', 'In Progress', 'Done'].map(status => (
                    <button
                      key={status}
                      onClick={() => updateEventStatus(event._id, status)}
                      className={`w-full text-left px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 flex items-center gap-2 ${event.status === status ? 'font-semibold' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${status === 'To Do' ? 'bg-blue-500' : status === 'In Progress' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                      {status}
                      {event.status === status && <span className="ml-auto text-white/40">✓</span>}
                    </button>
                  ))}
                  <div className="border-t border-white/10 my-1"></div>
                  <button
                    onClick={() => {
                      deleteEvent(event._id);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[550px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-sm transition"
          >
            ←
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 rounded-lg text-sm font-medium transition"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-sm transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(name => (
          <div key={name} className="text-center text-xs font-semibold text-white/40 py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10">
        {calendarDays}
      </div>

    </div>
  );
}

export default CalendarView;
