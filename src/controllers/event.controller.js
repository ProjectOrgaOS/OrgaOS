import Event from '../models/event.model.js';

// Create a new event
export async function createEvent(req, res) {
  try {
    const { title, start, end, allDay } = req.body;
    const userId = req.user.userId;

    const event = await Event.create({
      title,
      start,
      end,
      allDay: allDay || false,
      user: userId,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get all events for the current user
export async function getMyEvents(req, res) {
  try {
    const userId = req.user.userId;

    const events = await Event.find({ user: userId });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update an event (only if it belongs to the user)
export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, start, end, allDay, status } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updated = await Event.findByIdAndUpdate(
      id,
      {
        title: title ?? event.title,
        start: start ?? event.start,
        end: end ?? event.end,
        allDay: allDay ?? event.allDay,
        status: status ?? event.status
      },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Delete an event (only if it belongs to the user)
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Ensure the event belongs to the user
    if (event.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
