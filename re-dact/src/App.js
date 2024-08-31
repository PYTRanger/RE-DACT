import React, { useState } from 'react';
import FileUploader from './FileUploader';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Welcome to Re-Dact' }
  ]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [entityToRedact, setEntityToRedact] = useState('names');
  const [sessionId] = useState(() => generateSessionId());

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage = { sender: 'user', text: input };
    setMessages([...messages, userMessage]);

    try {
      if (input.startsWith('redact ')) {
        const entity = input.split(' ')[1];
        setEntityToRedact(entity);

        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('entity-type', entity);

          const uploadResponse = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const fileData = await uploadResponse.json();
            const filePath = fileData.file_path;

         
            const sendResponse = await axios.post('http://localhost:5000/send', {
              file_path: filePath,
              entity_type: entity
            });

            const botReply = { sender: 'bot', text: sendResponse.data.reply };
            setMessages(prevMessages => [...prevMessages, botReply]);

            if (sendResponse.data.file_url) {
              const downloadLink = sendResponse.data.file_url;
              const link = document.createElement('a');
              link.href = downloadLink;
              link.setAttribute('download', 'redacted_output.docx'); 
              document.body.appendChild(link);
              link.click();
              link.remove();
            } else {
              const errorReply = { sender: 'bot', text: 'Error processing file.' };
              setMessages(prevMessages => [...prevMessages, errorReply]);
            }
          } else {
            const errorReply = { sender: 'bot', text: 'Error uploading file.' };
            setMessages(prevMessages => [...prevMessages, errorReply]);
          }
        } else {
          const errorReply = { sender: 'bot', text: 'No file selected for upload.' };
          setMessages(prevMessages => [...prevMessages, errorReply]);
        }
      } else {
        const response = await axios.post('http://localhost:5000/send', {
          message: input,
          session_id: sessionId
        });

        const botReply = { sender: 'bot', text: response.data.reply };
        setMessages(prevMessages => [...prevMessages, botReply]);
      }
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
        <h2>Redact</h2>
        <FileUploader setFile={setFile} />
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


function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}

export default App;
