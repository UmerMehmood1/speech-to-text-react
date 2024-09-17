import React from 'react';
import './Toast.css'; // Create a Toast CSS file for styling

const Toast = ({ message }) => {
    return (
        <div className="toast-container">
            <p>{message}</p>
        </div>
    );
};

export default Toast;
