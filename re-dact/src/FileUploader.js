import React, { useState } from 'react';
import axios from 'axios';

const FileUploader = ({ setFile }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState("");

    const onFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        } else {
            setMessage("No file selected.");
        }
    };

    const uploadFile = async () => {
        if (!selectedFile) {
            setMessage("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.file_path) {
                setFile(selectedFile); 
                setMessage("File uploaded successfully.");
            } else {
                setMessage("Error uploading file.");
            }
        } catch (error) {
            setMessage("Error uploading file: " + error.message);
        }
    };

    return (
        <div>
            <input type="file" onChange={onFileChange} />
            <button onClick={uploadFile}>Upload</button>
            <p>{message}</p>
        </div>
    );
};

export default FileUploader;
