import { useState, useEffect } from 'react'
import '../css/ConfirmDialog.css'

/**
 * Black & Gold themed confirm dialog component
 * @param {boolean} isOpen - Whether to show the dialog
 * @param {string} title - Dialog title
 * @param {string} message - Main message content
 * @param {Array} details - Details list [{label: 'Level', value: 'Lv.1'}]
 * @param {string} warning - Warning text
 * @param {string} tip - Tip text
 * @param {function} onConfirm - Confirm callback
 * @param {function} onCancel - Cancel callback
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @param {string} type - Dialog type: 'warning' | 'danger' | 'info'
 */
function ConfirmDialog({
  isOpen,
  title = 'Confirm',
  message = '',
  details = [],
  warning = '',
  tip = '',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = (callback) => {
    setIsClosing(true)
    setTimeout(() => {
      callback && callback()
    }, 200)
  }

  if (!isOpen) return null

  const getTypeIcon = () => {
    switch (type) {
      case 'danger': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '⚔️'
    }
  }

  return (
    <div className={`confirm-dialog-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`confirm-dialog-container ${type} ${isClosing ? 'closing' : ''}`}>
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
          {message && <p className="dialog-message">{message}</p>}
          
          {details.length > 0 && (
            <div className="dialog-details">
              {details.map((detail, index) => (
                <div key={index} className="detail-row">
                  <span className="detail-label">{detail.label}:</span>
                  <span className={`detail-value ${detail.highlight ? 'highlight' : ''}`}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {warning && (
            <div className="dialog-warning">
              <span className="warning-icon">⚠️</span>
              <span>{warning}</span>
            </div>
          )}

          {tip && (
            <div className="dialog-tip">
              <span className="tip-icon">💡</span>
              <span>{tip}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="confirm-dialog-actions">
          <button 
            className="dialog-btn btn-cancel"
            onClick={() => handleClose(onCancel)}
          >
            {cancelText}
          </button>
          <button 
            className="dialog-btn btn-confirm"
            onClick={() => handleClose(onConfirm)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
