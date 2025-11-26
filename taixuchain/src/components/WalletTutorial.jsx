import { useState } from 'react'
import '../css/WalletTutorial.css'

function WalletTutorial({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [language, setLanguage] = useState('en') // 'en' or 'zh'
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  const translations = {
    en: {
      title: 'Beginner Tutorial',
      steps: [
        {
          title: 'Step 1: Download Wallet Plugin',
          content: 'First, you need to download and install the OneChain wallet extension',
          image: '/tutorial/step1.png',
          link: 'https://chromewebstore.google.com/detail/onechain/gclmcgmpkgblaglfokkaclneihpnbkli'
        },
        {
          title: 'Step 2: Register Wallet',
          content: 'After installation, click the extension icon in the top right corner of your browser and follow the prompts to register your wallet account',
          image: '/tutorial/step2.png'
        },
        {
          title: 'Step 3: Open Settings',
          content: 'After entering the wallet homepage, click the Settings button in the top right corner',
          image: '/tutorial/step3.png'
        },
        {
          title: 'Step 4: Enable Developer Mode',
          content: 'In the settings page, find and click Advanced Settings, then turn on Developer Mode',
          image: '/tutorial/step4.png'
        },
        {
          title: 'Step 5: Switch to Testnet',
          content: 'Return to the wallet homepage, click the network switch button (circle icon) in the top right corner, and select OneChain Testnet',
          image: '/tutorial/step5.png'
        },
        {
          title: 'Step 6: Get Test Tokens',
          content: 'In the testnet environment, click the Faucet button to get initial test tokens for paying gas fees',
          image: '/tutorial/step6.png'
        },
        {
          title: 'Step 7: Refresh Page',
          content: 'After completing the above steps, please refresh this page, then click the "Connect Wallet" button to start the game',
          image: '/tutorial/step7.png'
        }
      ],
      prev: 'Previous',
      next: 'Next',
      finish: 'Finish',
      downloadLink: 'Download OneChain Wallet →',
      confirmClose: 'Are you sure you want to close the tutorial?',
      confirmYes: 'Yes, Close',
      confirmNo: 'No, Continue',
      languageSwitch: '中文'
    },
    zh: {
      title: '新手教程',
      steps: [
        {
          title: '步骤 1: 下载钱包插件',
          content: '首先，您需要下载并安装 OneChain 钱包插件',
          image: '/tutorial/step1.png',
          link: 'https://chromewebstore.google.com/detail/onechain/gclmcgmpkgblaglfokkaclneihpnbkli'
        },
        {
          title: '步骤 2: 注册钱包',
          content: '安装完成后，点击浏览器右上角的插件图标，按照提示注册您的钱包账户',
          image: '/tutorial/step2.png'
        },
        {
          title: '步骤 3: 打开设置',
          content: '进入钱包首页后，点击右上角的 Settings（设置）按钮',
          image: '/tutorial/step3.png'
        },
        {
          title: '步骤 4: 开启开发者模式',
          content: '在设置页面中，找到并点击 Advanced Settings（高级设置），然后打开 Developer Mode（开发者模式）',
          image: '/tutorial/step4.png'
        },
        {
          title: '步骤 5: 切换到测试网',
          content: '返回钱包首页，点击右上角的网络切换按钮（圆圈图标），选择 OneChain Testnet（测试网）',
          image: '/tutorial/step5.png'
        },
        {
          title: '步骤 6: 获取测试币',
          content: '在测试网环境下，点击 Faucet（水龙头）按钮，获取初始测试币用于支付 Gas 费用',
          image: '/tutorial/step6.png'
        },
        {
          title: '步骤 7: 刷新页面',
          content: '完成以上步骤后，请刷新本页面，然后点击"连接钱包"按钮开始游戏',
          image: '/tutorial/step7.png'
        }
      ],
      prev: '上一步',
      next: '下一步',
      finish: '完成',
      downloadLink: '前往下载 OneChain 钱包 →',
      confirmClose: '确定要关闭教程吗？',
      confirmYes: '是的，关闭',
      confirmNo: '不，继续学习',
      languageSwitch: 'English'
    }
  }

  const t = translations[language]
  const steps = t.steps

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCloseClick = () => {
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

  const currentStepData = steps[currentStep]

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        <button className="tutorial-language-toggle" onClick={toggleLanguage}>
          🌐 {t.languageSwitch}
        </button>
        <button className="tutorial-close" onClick={handleCloseClick}>×</button>
        
        <div className="tutorial-header">
          <h2>{t.title}</h2>
          <div className="tutorial-progress">
            {currentStep + 1} / {steps.length}
          </div>
        </div>

        <div className="tutorial-content">
          <h3>{currentStepData.title}</h3>
          <p>{currentStepData.content}</p>
          
          {currentStepData.image && (
            <div className="tutorial-image-placeholder">
              <span>📱</span>
              <p>{language === 'en' ? 'Image Placeholder' : '图片占位符'}</p>
            </div>
          )}

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
                onClick={() => setCurrentStep(index)}
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
}

export default WalletTutorial
