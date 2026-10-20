import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [memes, setMemes] = useState([]);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [error, setError] = useState(null);

  const handleImageUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate memes');

      setMemes(data.memes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>🤖 AI Meme Generator</h1>
        <p>Upload any image and let AI craft 6 hilarious custom memes instantly.</p>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>⚠️ Error: {error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {!loading && memes.length === 0 && (
          <div 
            className="drop-zone"
            onClick={() => document.getElementById('file-input').click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleImageUpload(e.dataTransfer.files[0]); }}
          >
            <p className="drop-text">Drag & drop your image here, or <span>browse</span></p>
            <p className="drop-sub">Supports JPG, PNG, WEBP</p>
            <input id="file-input" type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); }} style={{ display: 'none' }} />
          </div>
        )}

        {loading && (
          <div className="loading-section">
            <div className="spinner"></div>
            <p className="loading-text">GPT-4o-mini is cooking up hilarious captions...</p>
            <p className="loading-sub">This takes about 5–10 seconds.</p>
          </div>
        )}

        {!loading && memes.length > 0 && (
          <div>
            <div className="results-header">
              <h2>Select Your Favorite Meme:</h2>
              <button className="reset-btn" onClick={() => setMemes([])}>🔄 Upload Another Image</button>
            </div>

            <div className="meme-grid">
              {memes.map((meme, index) => (
                <div key={index} className="meme-card" onClick={() => setSelectedMeme(meme.image)}>
                  <div className="meme-img-wrapper">
                    <img src={meme.image} alt={`Meme ${index + 1}`} />
                  </div>
                  <div className="meme-card-body">
                    <p>"{meme.caption}"</p>
                    <button className="select-btn">Select & View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedMeme && (
          <div className="modal-overlay" onClick={() => setSelectedMeme(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedMeme(null)}>&times;</button>
              <h3>Your Custom Meme</h3>
              <img src={selectedMeme} alt="Selected Meme" className="modal-img" />
              <div className="modal-actions">
                <a href={selectedMeme} download="custom_meme.jpg" className="download-btn">⬇️ Download Meme</a>
                <button className="close-btn" onClick={() => setSelectedMeme(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        Powered by OpenAI GPT-4o-mini & Vercel Serverless
      </footer>
    </div>
  );
}