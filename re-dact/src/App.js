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
  const [sessionId] = useState(() => generateSessionId());

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage = { sender: 'user', text: input };
    setMessages([...messages, userMessage]);

    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const fileType = file.name.split('.').pop().toLowerCase();
        let endpoint = '';
        let downloadFilename = '';

        if (['docx', 'pdf'].includes(fileType)) {
          if (input.startsWith('redact ')) {
            const entity = input.split(' ')[1];
            formData.append('entity-type', entity);
            endpoint = 'http://localhost:5000/send';
            downloadFilename = 'redacted_output.docx';
          } else {
            throw new Error('Unsupported action for document files.');
          }
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
          if (/^(censor faces|redact faces|hide faces|remove faces)$/i.test(input.trim())) {
            endpoint = 'http://localhost:5000/censor-faces';
            downloadFilename = 'censored_image.png';
          } else {
            throw new Error('Unsupported action for image files.');
          }
        } else {
          throw new Error('Unsupported file format.');
        }

        const uploadResponse = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const fileData = await uploadResponse.json();
          const filePath = fileData.file_path;

          const sendResponse = await axios.post(endpoint, {
            file_path: filePath,
            entity_type: formData.get('entity-type'),
          });

          const botReply = { sender: 'bot', text: sendResponse.data.reply };
          setMessages(prevMessages => [...prevMessages, botReply]);

          if (sendResponse.data.file_url) {
            const downloadLink = sendResponse.data.file_url;
            const link = document.createElement('a');
            link.href = downloadLink;
            link.setAttribute('download', downloadFilename);
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
    } catch (error) {
      console.error('Error sending message:', error);
      const errorReply = { sender: 'bot', text: error.message || 'Sorry, there was an error processing your request.' };
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
