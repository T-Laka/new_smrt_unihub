import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { chatThreads } from '../data/siteData';

const seedMessages = {
  'ride-101': [
    { id: 1, sender: 'Kasun Perera', body: 'I will arrive near the library in 5 minutes.' },
    { id: 2, sender: 'You', body: 'Perfect, I am waiting outside the student center.' }
  ],
  'ride-102': [
    { id: 1, sender: 'Nimali Fernando', body: 'Please confirm the pickup point.' }
  ],
  'ride-103': [
    { id: 1, sender: 'Driver Support', body: 'Your ride has been marked as complete.' }
  ]
};

export default function ChatPage() {
  const [activeThreadId, setActiveThreadId] = useState(chatThreads[0].id);
  const [draftMessage, setDraftMessage] = useState('');
  const [threadMessages, setThreadMessages] = useState(seedMessages);

  const activeThread = useMemo(
    () => chatThreads.find((thread) => thread.id === activeThreadId) || chatThreads[0],
    [activeThreadId]
  );

  const messages = threadMessages[activeThreadId] || [];

  function handleSend(event) {
    event.preventDefault();

    if (!draftMessage.trim()) {
      return;
    }

    setThreadMessages((current) => ({
      ...current,
      [activeThreadId]: [
        ...(current[activeThreadId] || []),
        { id: Date.now(), sender: 'You', body: draftMessage.trim() }
      ]
    }));
    setDraftMessage('');
  }

  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Chat"
        subtitle="Follow ride conversations with drivers and support in one place."
      />

      <section className="section-block">
        <div className="container chat-shell">
          <aside className="surface chat-list">
            <h2>Conversations</h2>
            <div className="card-stack">
              {chatThreads.map((thread) => (
                <button
                  type="button"
                  key={thread.id}
                  className={`thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  <strong>{thread.name}</strong>
                  <span>{thread.preview}</span>
                  {thread.unread ? <span className="pill accent">New</span> : null}
                </button>
              ))}
            </div>
          </aside>

          <div className="surface chat-panel">
            <div className="chat-header">
              <div>
                <h2>{activeThread.name}</h2>
                <p>{activeThread.preview}</p>
              </div>
            </div>

            <div className="message-list">
              {messages.map((message) => (
                <div key={message.id} className={`message-bubble ${message.sender === 'You' ? 'outbound' : 'inbound'}`}>
                  <strong>{message.sender}</strong>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>

            <form className="message-composer" onSubmit={handleSend}>
              <input
                type="text"
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder="Type a message"
              />
              <button type="submit" className="button button-primary">Send</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}