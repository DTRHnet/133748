import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './App.css'

function EchoHeistApp() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setDownloadUrl(null)

    try {
      const response = await fetch('/api/echoheist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process URL')
      }

      setResult(data)
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = result.filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 EchoHEIST</h1>
        <p>Download audio files from supported websites</p>
      </header>

      <main className="app-main">
        <form onSubmit={handleSubmit} className="url-form">
          <div className="input-group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL (e.g., https://example.com/audio)"
              className="url-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? 'Processing...' : 'Download'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result-container">
            <h3>✅ Success</h3>
            <div className="result-info">
              <p><strong>URL:</strong> {result.originalUrl}</p>
              <p><strong>Filename:</strong> {result.filename}</p>
              <p><strong>Size:</strong> {result.fileSize}</p>
              {result.duration && <p><strong>Duration:</strong> {result.duration}</p>}
            </div>
            
            {downloadUrl && (
              <div className="download-section">
                <button onClick={handleDownload} className="download-btn">
                  📥 Download File
                </button>
              </div>
            )}
          </div>
        )}

        <div className="help-section">
          <h3>Supported Sites</h3>
          <ul>
            <li>Ultimate Guitar tabs</li>
            <li>SoundCloud</li>
            <li>Bandcamp</li>
            <li>And many more...</li>
          </ul>
        </div>
      </main>

      <footer className="app-footer">
        <p>Powered by EchoHEIST - The ultimate audio downloader</p>
      </footer>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<EchoHeistApp />)
