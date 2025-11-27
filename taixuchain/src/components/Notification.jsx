import { useState, useEffect, useCallback } from 'react'
import '../css/Notification.css'

// Notification Manager - Singleton pattern
class NotificationManager {
  constructor() {
    this.listeners = []
    this.notifications = []
    this.nextId = 1
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  notify(listener) {
    listener(this.notifications)
  }

  show({ type = 'info', title, message, duration = 5000 }) {
    const notification = {
      id: this.nextId++,
      type,
      title,
      message,
      duration
    }
    
    this.notifications.push(notification)
    this.listeners.forEach(listener => this.notify(listener))

    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification.id)
      }, duration)
    }

    return notification.id
  }

  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.listeners.forEach(listener => this.notify(listener))
  }

  success(title, message, duration) {
    return this.show({ type: 'success', title, message, duration })
  }

  error(title, message, duration) {
    return this.show({ type: 'error', title, message, duration })
  }

  warning(title, message, duration) {
    return this.show({ type: 'warning', title, message, duration })
  }

  info(title, message, duration) {
    return this.show({ type: 'info', title, message, duration })
  }
}

export const notificationManager = new NotificationManager()

// Notification Component
function NotificationItem({ notification, onClose }) {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(notification.id)
    }, 400)
  }

  useEffect(() => {
    if (notification.duration > 0) {
      const timer = setTimeout(handleClose, notification.duration)
      return () => clearTimeout(timer)
    }
  }, [notification.duration])

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`notification ${notification.type} ${isExiting ? 'exit' : ''}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {icons[notification.type]}
        </div>
        <div className="notification-text">
          <h4 className="notification-title">{notification.title}</h4>
          <p className="notification-message">{notification.message}</p>
        </div>
      </div>
      <button className="notification-close" onClick={handleClose}>
        ×
      </button>
      {notification.duration > 0 && (
        <div 
          className="notification-progress" 
          style={{ '--duration': `${notification.duration}ms` }}
        />
      )}
    </div>
  )
}

export function NotificationContainer() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications)
    return unsubscribe
  }, [])

  const handleClose = useCallback((id) => {
    notificationManager.remove(id)
  }, [])

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={handleClose}
        />
      ))}
    </div>
  )
}

// Confirm Dialog Component
export function ConfirmDialog({ 
  isOpen, 
  type = 'warning',
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) {
  if (!isOpen) return null

  const icons = {
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  }

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className={`confirm-dialog ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-icon">
          {icons[type]}
        </div>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-buttons">
          <button className="confirm-dialog-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-dialog-btn confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationContainer
