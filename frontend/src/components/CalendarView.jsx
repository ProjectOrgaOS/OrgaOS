import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Setup date-fns localizer
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3000/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Convert date strings to JS Date objects
        const formattedEvents = data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[600px] bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
        <p className="text-gray-500">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-white p-4 rounded-lg shadow-md">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        style={{ height: '100%' }}
      />
    </div>
  );
}

export default CalendarView;
