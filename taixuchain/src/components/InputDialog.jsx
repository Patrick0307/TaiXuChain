import { useState, useEffect, useRef } from 'react'
import '../css/ConfirmDialog.css'

/**
 * Black & Gold themed input dialog component
 */
function InputDialog({
  isOpen,
  title = 'Input',
  message = '',
  details = [],
  placeholder = '',
  inputType = 'number',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setInputValue('')
      // Auto focus input
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleClose = (callback, value = null) => {
    setIsClosing(true)
    setTimeout(() => {
      callback && callback(value)
    }, 200)
  }

  const handleConfirm = () => {
    if (inputValue.trim()) {
      handleClose(onConfirm, inputValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleConfirm()
    } else if (e.key === 'Escape') {
      handleClose(onCancel)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`confirm-dialog-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`confirm-dialog-container info ${isClosing ? 'closing' : ''}`}>
        {/* Decorative corners */}
        <div className="dialog-corner top-left"></div>
        <div className="dialog-corner top-right"></div>
        <div className="dialog-corner bottom-left"></div>
        <div className="dialog-corner bottom-right"></div>
        
        {/* Title */}
        <div className="confirm-dialog-header">
          <span className="dialog-icon">📦</span>
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

          {/* Input field */}
          <div className="dialog-input-wrapper">
            <label className="dialog-input-label">{placeholder}</label>
            <input
              ref={inputRef}
              type={inputType}
              className="dialog-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              min={inputType === 'number' ? '0' : undefined}
              step={inputType === 'number' ? 'any' : undefined}
            />
          </div>
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
            onClick={handleConfirm}
            disabled={!inputValue.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InputDialog
