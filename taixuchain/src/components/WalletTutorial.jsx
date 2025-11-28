import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import '../css/WalletTutorial.css'

function WalletTutorial({ onClose, isForced = false, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [language, setLanguage] = useState('en')
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  useEffect(() => {
    console.log('🎓 WalletTutorial mounted, isForced:', isForced)
    return () => console.log('🎓 WalletTutorial unmounted')
  }, [])

  const translations = {
    en: {
      title: 'Beginner Tutorial',
      steps: [
        { title: 'Step 1: Download Wallet Plugin', content: 'First, you need to download and install the OneChain wallet extension', image: '/tutorial/step1.png', link: 'https://chromewebstore.google.com/detail/onechain/gclmcgmpkgblaglfokkaclneihpnbkli' },
        { title: 'Step 2: Register Wallet', content: 'After installation, click the extension icon in the top right corner of your browser and follow the prompts to register your wallet account', image: '/tutorial/step2.png' },
        { title: 'Step 3: Open Settings', content: 'After entering the wallet homepage, click the Settings button in the top right corner', image: '/tutorial/step3.png' },
        { title: 'Step 4: Enable Developer Mode', content: 'In the settings page, find and click Advanced Settings, then turn on Developer Mode', image: '/tutorial/step4.png' },
        { title: 'Step 5: Switch to Testnet', content: 'Return to the wallet homepage, click the network switch button (circle icon) in the top right corner, and select OneChain Testnet', image: '/tutorial/step5.png' },
        { title: 'Step 6: Get Test Tokens', content: 'In the testnet environment, click the Faucet button to get initial test tokens for paying gas fees', image: '/tutorial/step6.png' },
        { title: 'Step 7: Refresh Page', content: 'After completing the above steps, please refresh this page, then click the "Connect Wallet" button to start the game', image: '/tutorial/step7.png' }
      ],
      prev: 'Previous',
      next: 'Next',
      finish: 'Finish',
      downloadLink: 'Download OneChain Wallet →',
      confirmClose: 'Are you sure you want to close the tutorial?',
      confirmYes: 'Yes, Close',
      confirmNo: 'No, Continue',
      languageSwitch: 'English'
    }
  }

  const t = translations[language]
  const steps = t.steps
  const currentStepData = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      if (nextStep === steps.length - 1) {
        localStorage.setItem('taixuchain_tutorial_completed', 'true')
      }
    } else {
      if (isForced && onComplete) {
        onComplete()
      } else {
        onClose()
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleCloseClick = () => {
    if (isForced) return
    setShowConfirmClose(true)
  }

  const handleConfirmClose = () => {
    setShowConfirmClose(false)
    onClose()
  }

  const handleCancelClose = () => {
    setShowConfirmClose(false)
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en')
  }

  const tutorialContent = (
    <div className="tutorial-overlay" style={{ opacity: 1, visibility: 'visible', pointerEvents: 'auto' }}>
      <div className="tutorial-modal" style={{ opacity: 1, visibility: 'visible', pointerEvents: 'auto' }}>
        <button className="tutorial-language-toggle" onClick={toggleLanguage}>
          🌐 {t.languageSwitch}
        </button>
        {!isForced && (
          <button className="tutorial-close" onClick={handleCloseClick}>×</button>
        )}
        
        <div className="tutorial-header">
          <h2>{t.title}</h2>
          <div className="tutorial-progress">
            {currentStep + 1} / {steps.length}
          </div>
        </div>

        <div className="tutorial-content">
          <h3>{currentStepData.title}</h3>
          <p>{currentStepData.content}</p>
          
          {currentStepData.link && (
            <a 
              href={currentStepData.link}
              target="_blank"
              rel="noopener noreferrer"
              className="tutorial-link"
            >
              {t.downloadLink}
            </a>
          )}

          {currentStepData.image && (
            <div className="tutorial-image-container">
              <img 
                src={currentStepData.image} 
                alt={currentStepData.title}
                className="tutorial-image"
              />
            </div>
          )}
        </div>

        <div className="tutorial-navigation">
          <button 
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="tutorial-btn tutorial-btn-prev"
          >
            {t.prev}
          </button>
          
          <div className="tutorial-dots">
            {steps.map((_, index) => (
              <span 
                key={index}
                className={`tutorial-dot ${index === currentStep ? 'active' : ''}`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="tutorial-btn tutorial-btn-next"
          >
            {currentStep === steps.length - 1 ? t.finish : t.next}
          </button>
        </div>
      </div>

      {showConfirmClose && (
        <div className="tutorial-confirm-overlay">
          <div className="tutorial-confirm-box">
            <h3>{t.confirmClose}</h3>
            <div className="tutorial-confirm-buttons">
              <button 
                onClick={handleConfirmClose}
                className="tutorial-confirm-btn tutorial-confirm-yes"
              >
                {t.confirmYes}
              </button>
              <button 
                onClick={handleCancelClose}
                className="tutorial-confirm-btn tutorial-confirm-no"
              >
                {t.confirmNo}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(tutorialContent, document.body)
}

export default WalletTutorial
