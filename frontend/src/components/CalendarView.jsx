import { useState, useEffect } from 'react';

function CalendarView() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Handle right-click delete
  const handleEventContextMenu = (e, event) => {
    e.preventDefault();
    if (window.confirm(`Delete "${event.title}"?`)) {
      deleteEvent(event._id);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Build calendar grid
  const calendarDays = [];

  // Empty cells before first day
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="bg-gray-50 border border-gray-200 min-h-0" />
    );
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const today = isToday(day);

    calendarDays.push(
      <div
        key={day}
        className={`border border-gray-200 p-1 overflow-hidden hover:bg-blue-50 transition cursor-pointer min-h-0 flex flex-col ${
          today ? 'bg-blue-100' : 'bg-white'
        }`}
        onDrop={(e) => handleDrop(e, day)}
        onDragOver={handleDragOver}
      >
        <div className={`text-xs font-semibold mb-1 ${today ? 'text-blue-600' : 'text-gray-600'}`}>
          {day}
        </div>
        <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0">
          {dayEvents.map(event => (
            <div
              key={event._id}
              draggable
              onDragStart={(e) => handleEventDragStart(e, event)}
              onContextMenu={(e) => handleEventContextMenu(e, event)}
              className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded truncate hover:bg-blue-600 cursor-grab active:cursor-grabbing transition"
              title={event.title}
            >
              {event.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-[550px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            ←
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            →
          </button>
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(name => (
          <div key={name} className="text-center text-xs font-semibold text-gray-500 py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        {calendarDays}
      </div>

    </div>
  );
}

export default CalendarView;
