import React, { useState } from 'react';

const FileUploader = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [entityToRedact, setEntityToRedact] = useState("names");
    const [message, setMessage] = useState("");

    const onFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const onEntityChange = (event) => {
        setEntityToRedact(event.target.value);
    };

    const uploadFile = async () => {
        if (!selectedFile) {
            setMessage("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("entity-type", entityToRedact);

        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'redacted_output.docx'); // Change extension based on the output file type
            document.body.appendChild(link);
            link.click();
            link.remove();
        } else {
            setMessage("Error uploading file.");
        }
    };

    return (
        <div>
            <input type="file" onChange={onFileChange} />
            <select value={entityToRedact} onChange={onEntityChange}>
                <option value="names">Names</option>
                <option value="phones">Phones</option>
                <option value="addresses">Addresses</option>
            </select>
            <button onClick={uploadFile}>Upload and Redact</button>
            <p>{message}</p>
        </div>
    );
};

export default FileUploader;
