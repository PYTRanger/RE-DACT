import React, { useState } from 'react';
import FileUploader from './FileUploader';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => generateSessionId());

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage = { sender: 'user', text: input };
    setMessages([...messages, userMessage]);

    try {
      const response = await axios.post('http://localhost:5000/send', {
        message: input,
        session_id: sessionId
      });

      const botReply = { sender: 'bot', text: response.data.reply };
      setMessages(prevMessages => [...prevMessages, botReply]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorReply = { sender: 'bot', text: 'Sorry, there was an error processing your request.' };
      setMessages(prevMessages => [...prevMessages, errorReply]);
    }

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <h2>RE-DACT Chatbot</h2>
        <FileUploader />
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>
        <div className="input-area">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}

// Function to generate a random session ID
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}

export default App;
