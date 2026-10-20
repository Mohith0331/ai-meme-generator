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
        <p>Transform any ordinary photo into 6 hilarious, custom-captioned memes instantly using GPT-4o-mini.</p>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>⚠️ Error: {error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {!loading && memes.length === 0 && (
          <div className="hero-section">
            {/* Visual Workflow Showcase */}
            <div className="workflow-banner">
              <div className="workflow-step">
                <div className="step-icon">📤</div>
                <span>1. Upload Photo</span>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-icon">🧠</div>
                <span>2. AI Context Analysis</span>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-icon">🔥</div>
                <span>3. 6 Hilarious Memes</span>
              </div>
            </div>

            {/* Drag & Drop Upload Box */}
            <div 
              className="drop-zone"
              onClick={() => document.getElementById('file-input').click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleImageUpload(e.dataTransfer.files[0]); }}
            >
              <div className="upload-icon-pulse">✨</div>
              <p className="drop-text">Drag & drop your image here, or <span>browse files</span></p>
              <p className="drop-sub">Supports JPG, PNG, WEBP (Auto-optimized for speed)</p>
              <input id="file-input" type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); }} style={{ display: 'none' }} />
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-section">
            <div className="spinner"></div>
            <p className="loading-text">🎨 AI is analyzing your image & baking memes...</p>
            <p className="loading-sub">This takes about 10–20 seconds. Good things take time!</p>
          </div>
        )}

        {!loading && memes.length > 0 && (
          <div>
            <div className="results-header">
              <h2>🎉 Select Your Favorite Meme:</h2>
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
                    <button className="select-btn">Select & Download</button>
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
              <h3>Your Masterpiece</h3>
              <img src={selectedMeme} alt="Selected Meme" className="modal-img" />
              <div className="modal-actions">
                <a href={selectedMeme} download="ai_meme.jpg" className="download-btn">⬇️ Download Meme Image</a>
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