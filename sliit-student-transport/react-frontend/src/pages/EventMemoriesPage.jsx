import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { createEventMemory, deleteEventMemory, getEventMemories, updateEventMemory } from '../lib/eventCommunityApi';
import { readStoredUser } from '../lib/auth';

const IMAGE_SIZE_LIMIT = 2 * 1024 * 1024;
const EDIT_WINDOW_MS = 10 * 24 * 60 * 60 * 1000;

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EventMemoriesPage() {
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState('');
  const [editingMemoryId, setEditingMemoryId] = useState('');
  const [expandedMemoryId, setExpandedMemoryId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [],
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    images: [],
  });

  const currentUser = useMemo(() => {
    return readStoredUser();
  }, []);

  const shareableEvents = useMemo(() => {
    return events.filter((event) => ['approved', 'completed'].includes(event.status));
  }, [events]);

  const selectedEvent = useMemo(
    () => {
      if (shareableEvents.length === 0) return null;
      return [...shareableEvents].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
    },
    [shareableEvents]
  );

  const selectedEventId = selectedEvent?._id || '';

  const loadEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/events?includeAll=true');
      const nextEvents = Array.isArray(data)
        ? data.filter((event) => ['approved', 'completed'].includes(event.status))
        : [];
      setEvents(nextEvents);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemories = async (eventId) => {
    if (!eventId) {
      setMemories([]);
      return;
    }

    try {
      const data = await getEventMemories(eventId);
      setMemories(Array.isArray(data) ? data : []);
    } catch {
      setMemories([]);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadMemories(selectedEventId);
  }, [selectedEventId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      setFormData((prev) => ({ ...prev, images: [] }));
      return;
    }

    const oversized = files.find((file) => file.size > IMAGE_SIZE_LIMIT);
    if (oversized) {
      setAlert('Each image must be less than 2MB.');
      return;
    }

    try {
      const images = await Promise.all(files.slice(0, 4).map((file) => toDataUrl(file)));
      setFormData((prev) => ({ ...prev, images }));
    } catch {
      setAlert('Failed to read one or more images.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setAlert('');

    if (!selectedEventId) {
      setError('Please select a past event first.');
      return;
    }

    if (!formData.title.trim() && !formData.description.trim() && formData.images.length === 0) {
      setError('Add a title, description, or image before sharing memory.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEventMemory({
        eventId: selectedEventId,
        title: formData.title,
        description: formData.description,
        images: formData.images,
        sharedByName: currentUser?.name || 'Student',
        sharedByUserId: currentUser?._id,
      });

      setAlert('Memory shared successfully.');
      setFormData({ title: '', description: '', images: [] });
      await loadMemories(selectedEventId);
    } catch (err) {
      setError(err.message || 'Failed to share memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWithinEditWindow = (memory) => {
    const createdAtTime = new Date(memory.createdAt).getTime();
    if (!Number.isFinite(createdAtTime)) return false;
    return Date.now() - createdAtTime <= EDIT_WINDOW_MS;
  };

  const isMemoryOwner = (memory) => {
    return Boolean(
      currentUser?._id &&
      memory?.sharedByUserId &&
      String(memory.sharedByUserId) === String(currentUser._id)
    );
  };

  const canManageMemory = (memory) => {
    return isMemoryOwner(memory) && isWithinEditWindow(memory);
  };

  const getRemainingDays = (memory) => {
    const createdAtTime = new Date(memory.createdAt).getTime();
    if (!Number.isFinite(createdAtTime)) return 0;
    const remainingMs = EDIT_WINDOW_MS - (Date.now() - createdAtTime);
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  };

  const startEditMemory = (memory) => {
    if (!canManageMemory(memory)) return;
    setEditingMemoryId(memory._id);
    setEditFormData({
      title: memory.title || '',
      description: memory.description || '',
      images: [],
    });
  };

  const cancelEditMemory = () => {
    setEditingMemoryId('');
    setEditFormData({ title: '', description: '', images: [] });
  };

  const toggleMemoryDetails = (memoryId) => {
    setExpandedMemoryId((prev) => (prev === memoryId ? '' : memoryId));
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImageSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      setEditFormData((prev) => ({ ...prev, images: [] }));
      return;
    }

    const oversized = files.find((file) => file.size > IMAGE_SIZE_LIMIT);
    if (oversized) {
      setError('Each image must be less than 2MB.');
      return;
    }

    try {
      const images = await Promise.all(files.slice(0, 4).map((file) => toDataUrl(file)));
      setEditFormData((prev) => ({ ...prev, images }));
    } catch {
      setError('Failed to read one or more update images.');
    }
  };

  const handleUpdateMemory = async (memoryId) => {
    setError('');
    setAlert('');

    if (!currentUser?._id) {
      setError('Please login again to update memory.');
      return;
    }

    if (!editFormData.title.trim() && !editFormData.description.trim() && editFormData.images.length === 0) {
      setError('Add title, description, or new images when updating memory.');
      return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        actingUserId: currentUser._id,
        title: editFormData.title,
        description: editFormData.description,
      };

      if (editFormData.images.length > 0) {
        payload.images = editFormData.images;
      }

      await updateEventMemory(memoryId, payload);
      setAlert('Memory updated successfully.');
      cancelEditMemory();
      await loadMemories(selectedEventId);
    } catch (err) {
      setError(err.message || 'Failed to update memory');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    if (!window.confirm('Delete this memory?')) return;

    try {
      if (!currentUser?._id) {
        setError('Please login again to delete memory.');
        return;
      }

      await deleteEventMemory(memoryId, currentUser._id);
      setAlert('Memory deleted successfully.');
      await loadMemories(selectedEventId);
    } catch (err) {
      setError(err.message || 'Failed to delete memory');
    }
  };

  return (
    <section className="section-block">
      <div className="container eventsx-grid">
        <article className="surface eventsx-hero">
          <div>
            <span className="section-kicker">Past Event Sharing</span>
            <h2>Share Highlights and Photos</h2>
            <p>
              Upload key moments from approved or completed events, build event history, and keep the community inspired.
            </p>
          </div>
          <div className="eventsx-stat-grid">
            <div className="eventsx-stat-card"><strong>{shareableEvents.length}</strong><span>Shareable Events</span></div>
            <div className="eventsx-stat-card"><strong>{memories.length}</strong><span>Shared Memories</span></div>
            <div className="eventsx-stat-card"><strong>4</strong><span>Max Images/Post</span></div>
            <div className="eventsx-stat-card"><strong>Live</strong><span>Public Feed</span></div>
          </div>
        </article>

        {alert ? <div className="surface eventsx-empty"><p>{alert}</p></div> : null}
        {error ? <div className="surface eventsx-empty"><p className="text-danger">{error}</p></div> : null}

        <div className="eventsx-create-grid">
          <form className="surface eventsx-create-form" onSubmit={handleSubmit}>
            <div className="eventsx-detail-card">
              <h4>Sharing To Event</h4>
              {!selectedEvent ? <p>No approved or completed events available to share memories yet.</p> : null}
            </div>

            <label>
              <span>Memory Title</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Talent show highlight"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Share what happened, outcomes, and special moments"
              />
            </label>

            <label>
              <span>Upload Images (max 4, each under 2MB)</span>
              <input type="file" accept="image/*" multiple onChange={handleImageSelect} />
            </label>

            {formData.images.length > 0 ? (
              <div className="eventsx-memory-preview-grid">
                {formData.images.map((image, index) => (
                  <img key={`${image}-${index}`} src={image} alt={`Upload preview ${index + 1}`} />
                ))}
              </div>
            ) : null}

            <div className="eventsx-actions">
              <button type="submit" className="button button-primary" disabled={isSubmitting || isLoading || !selectedEventId}>
                {isSubmitting ? 'Sharing...' : 'Share Memory'}
              </button>
              <Link to="/events" className="button button-ghost">Back to Events</Link>
            </div>
          </form>

          <aside className="surface eventsx-create-side">
            <h3>Memory Feed</h3>

            {isLoading ? (
              <p>Loading events...</p>
            ) : memories.length === 0 ? (
              <p>No memories shared yet for this event.</p>
            ) : (
              <div className="eventsx-community-grid">
                {memories.map((memory) => (
                  <article key={memory._id} className="eventsx-community-card">
                    {memory.images?.length ? <img src={memory.images[0]} alt={memory.title || 'Event memory'} /> : null}
                    <h4>{memory.title || 'Shared Memory'}</h4>
                    <p>{memory.description || 'No description provided.'}</p>
                    <div className="eventsx-meta">
                      <span>By: {memory.sharedByName}</span>
                      <span>{new Date(memory.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="eventsx-actions" style={{ marginTop: '0.6rem' }}>
                      <button
                        type="button"
                        className="button button-small button-ghost"
                        onClick={() => toggleMemoryDetails(memory._id)}
                      >
                        {expandedMemoryId === memory._id ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>

                    {expandedMemoryId === memory._id ? (
                      <div className="eventsx-detail-card" style={{ marginTop: '0.6rem' }}>
                        <p><strong>Event:</strong> {selectedEvent?.title || 'Community Event'}</p>
                        <p><strong>Shared By:</strong> {memory.sharedByName || 'Student'}</p>
                        <p><strong>Shared On:</strong> {new Date(memory.createdAt).toLocaleString()}</p>
                        <p><strong>Description:</strong> {memory.description || 'No description provided.'}</p>
                        {memory.images?.length ? (
                          <div className="eventsx-memory-preview-grid">
                            {memory.images.map((image, index) => (
                              <img key={`detail-${memory._id}-${index}`} src={image} alt={`Memory detail ${index + 1}`} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {isMemoryOwner(memory) ? (
                      <p className="eventsx-muted-note" style={{ marginTop: '0.4rem' }}>
                        {isWithinEditWindow(memory)
                          ? `Editable for ${getRemainingDays(memory)} more day(s)`
                          : 'Edit/Delete window expired (10 days passed)'}
                      </p>
                    ) : null}

                    {editingMemoryId === memory._id ? (
                      <div className="eventsx-detail-card" style={{ marginTop: '0.7rem' }}>
                        <label>
                          <span>Memory Title</span>
                          <input
                            type="text"
                            name="title"
                            value={editFormData.title}
                            onChange={handleEditInputChange}
                            placeholder="Update title"
                          />
                        </label>
                        <label>
                          <span>Description</span>
                          <textarea
                            rows={3}
                            name="description"
                            value={editFormData.description}
                            onChange={handleEditInputChange}
                            placeholder="Update description"
                          />
                        </label>
                        <label>
                          <span>Replace Images (optional, max 4)</span>
                          <input type="file" accept="image/*" multiple onChange={handleEditImageSelect} />
                        </label>
                        {editFormData.images.length > 0 ? (
                          <div className="eventsx-memory-preview-grid">
                            {editFormData.images.map((image, index) => (
                              <img key={`edit-${memory._id}-${index}`} src={image} alt={`Edit preview ${index + 1}`} />
                            ))}
                          </div>
                        ) : null}
                        <div className="eventsx-actions">
                          <button
                            type="button"
                            className="button button-small button-primary"
                            disabled={isUpdating}
                            onClick={() => handleUpdateMemory(memory._id)}
                          >
                            {isUpdating ? 'Updating...' : 'Save Update'}
                          </button>
                          <button type="button" className="button button-small button-ghost" onClick={cancelEditMemory}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {canManageMemory(memory) ? (
                      <div className="eventsx-actions" style={{ marginTop: '0.6rem' }}>
                        <button type="button" className="button button-small button-ghost" onClick={() => startEditMemory(memory)}>
                          Update
                        </button>
                        <button type="button" className="button button-small" onClick={() => handleDeleteMemory(memory._id)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
