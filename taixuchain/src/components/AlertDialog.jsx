import { useState, useEffect } from 'react'
import '../css/ConfirmDialog.css'

/**
 * Black & Gold themed alert dialog component (replaces browser alert)
 * @param {boolean} isOpen - Whether to show the dialog
 * @param {string} title - Dialog title
 * @param {string} message - Main message content
 * @param {string} type - Dialog type: 'success' | 'error' | 'warning' | 'info'
 * @param {function} onClose - Close callback
 * @param {string} buttonText - Button text
 */
function AlertDialog({
  isOpen,
  title = 'Notice',
  message = '',
  type = 'info',
  onClose,
  buttonText = 'OK'
}) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose && onClose()
    }, 200)
  }

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const getTypeIcon = () => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  const getDialogType = () => {
    switch (type) {
      case 'success': return 'info'
      case 'error': return 'danger'
      case 'warning': return 'warning'
      default: return 'info'
    }
  }

  // Parse message to handle line breaks
  const renderMessage = () => {
    if (!message) return null
    const lines = message.split('\n')
    return lines.map((line, index) => (
      <span key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className={`confirm-dialog-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`confirm-dialog-container ${getDialogType()} ${isClosing ? 'closing' : ''}`}>
        {/* Decorative corners */}
        <div className="dialog-corner top-left"></div>
        <div className="dialog-corner top-right"></div>
        <div className="dialog-corner bottom-left"></div>
        <div className="dialog-corner bottom-right"></div>
        
        {/* Title */}
        <div className="confirm-dialog-header">
          <span className="dialog-icon">{getTypeIcon()}</span>
          <h3>{title}</h3>
        </div>

        {/* Content */}
        <div className="confirm-dialog-content">
          <p className="dialog-message">{renderMessage()}</p>
        </div>

        {/* Button */}
        <div className="confirm-dialog-actions" style={{ justifyContent: 'center' }}>
          <button 
            className="dialog-btn btn-confirm"
            onClick={handleClose}
            autoFocus
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Alert Manager - Singleton pattern for global alerts
class AlertManager {
  constructor() {
    this.listeners = []
    this.currentAlert = null
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  notify() {
    this.listeners.forEach(listener => listener(this.currentAlert))
  }

  show({ type = 'info', title, message }) {
    return new Promise((resolve) => {
      this.currentAlert = {
        type,
        title,
        message,
        onClose: () => {
          this.currentAlert = null
          this.notify()
          resolve()
        }
      }
      this.notify()
    })
  }

  success(message, title = 'Success') {
    return this.show({ type: 'success', title, message })
  }

  error(message, title = 'Error') {
    return this.show({ type: 'error', title, message })
  }

  warning(message, title = 'Warning') {
    return this.show({ type: 'warning', title, message })
  }

  info(message, title = 'Notice') {
    return this.show({ type: 'info', title, message })
  }
}

export const alertManager = new AlertManager()

// Global Alert Container Component
export function AlertContainer() {
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    const unsubscribe = alertManager.subscribe(setAlert)
    return unsubscribe
  }, [])

  if (!alert) return null

  return (
    <AlertDialog
      isOpen={true}
      type={alert.type}
      title={alert.title}
      message={alert.message}
      onClose={alert.onClose}
    />
  )
}

export default AlertDialog
