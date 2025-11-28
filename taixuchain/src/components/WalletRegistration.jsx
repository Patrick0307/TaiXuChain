import { useState, useEffect } from 'react'
import WalletTutorial from './WalletTutorial'
import '../css/WalletRegistration.css'

function WalletRegistration({ onRegistrationSuccess }) {
  const [walletAddress, setWalletAddress] = useState(null)
  const [error, setError] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [providerReady, setProviderReady] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isForcedTutorial, setIsForcedTutorial] = useState(false)

  // 检查是否第一次访问
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('taixuchain_tutorial_completed')
    if (!hasSeenTutorial) {
      // 第一次访问，强制显示 tutorial
      setShowTutorial(true)
      setIsForcedTutorial(true)
      console.log('🎓 First time visitor - showing mandatory tutorial')
    }
  }, [])

  // 等待钱包扩展注入
  useEffect(() => {
    const checkProvider = () => {
      // 打印所有可能的钱包对象
      console.log('=== 检查所有钱包对象 ===')
      console.log('window.onechain:', window.onechain)
      console.log('window.onechainWallet:', window.onechainWallet)
      console.log('window.__onechainInjected__:', window.__onechainInjected__)
      
      if (window.onechain || window.onechainWallet || window.__onechainInjected__) {
        console.log('OneChain 钱包扩展已检测到')
        setProviderReady(true)
        return true
      }
      return false
    }

    // 立即检查
    if (checkProvider()) return

    // 多次检查，因为扩展可能需要时间加载
    const timers = [500, 1000, 2000].map(delay => 
      setTimeout(() => {
        if (checkProvider()) return
        if (delay === 2000) {
          console.log('未检测到钱包扩展')
        }
      }, delay)
    )

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [])

  const connectWallet = async () => {
    setIsConnecting(true)
    setError('')

    try {
      // 等待一下确保扩展完全加载
      await new Promise(resolve => setTimeout(resolve, 100))

      console.log('=== 开始连接钱包 ===')
      
      // 检查 OneChain 钱包
      let provider = window.onechainWallet || window.onechain
      
      if (!provider) {
        setError('Please install OneChain wallet extension first, then refresh the page')
        setIsConnecting(false)
        return
      }

      console.log('OneChain wallet detected')
      console.log('Wallet object:', provider)
      console.log('Available methods:', Object.keys(provider))
      console.log('Available properties:', Object.getOwnPropertyNames(provider))

      // OneChain 钱包连接方法
      let accounts = null
      let address = null
      
      // 方法 1: connect
      if (provider.connect && typeof provider.connect === 'function') {
        console.log('尝试使用 connect 方法')
        try {
          const result = await provider.connect()
          console.log('connect 方法返回:', result)
          if (result && result.address) {
            address = result.address
          } else if (result && typeof result === 'string') {
            address = result
          }
        } catch (e) {
          console.log('connect 方法失败:', e)
        }
      }
      
      // 方法 2: enable
      if (!address && provider.enable && typeof provider.enable === 'function') {
        console.log('尝试使用 enable 方法')
        try {
          const result = await provider.enable()
          console.log('enable 方法返回:', result)
          if (result && result.address) {
            address = result.address
          } else if (Array.isArray(result) && result.length > 0) {
            address = result[0]
          }
        } catch (e) {
          console.log('enable 方法失败:', e)
        }
      }
      
      // 方法 3: getAccount
      if (!address && provider.getAccount && typeof provider.getAccount === 'function') {
        console.log('尝试使用 getAccount 方法')
        try {
          const result = await provider.getAccount()
          console.log('getAccount 方法返回:', result)
          if (result && result.address) {
            address = result.address
          } else if (typeof result === 'string') {
            address = result
          }
        } catch (e) {
          console.log('getAccount 方法失败:', e)
        }
      }
      
      // 方法 4: getAccounts
      if (!address && provider.getAccounts && typeof provider.getAccounts === 'function') {
        console.log('尝试使用 getAccounts 方法')
        try {
          accounts = await provider.getAccounts()
          console.log('getAccounts 方法返回:', accounts)
          if (accounts && accounts.length > 0) {
            address = accounts[0]
          }
        } catch (e) {
          console.log('getAccounts 方法失败:', e)
        }
      }

      console.log('最终获取到的地址:', address)

      if (address) {
        // 检查当前网络
        if (provider.getChain && typeof provider.getChain === 'function') {
          try {
            const chain = await provider.getChain()
            console.log('当前网络:', chain)
            
            // If not testnet, prompt user to switch
            if (chain && !chain.toLowerCase().includes('test')) {
              setError('Please switch to Testnet network in OneChain wallet')
              setIsConnecting(false)
              return
            }
          } catch (e) {
            console.log('获取网络信息失败:', e)
          }
        }
        
        setWalletAddress(address)
        // 保存 provider 供后续使用
        window.currentWalletProvider = provider
        window.suiWallet = provider // 供区块链注册使用
        window.currentWalletAddress = address // 保存地址供交易使用
        onRegistrationSuccess(address)
      } else {
        setError('Unable to get wallet address, please check if wallet is unlocked')
      }
    } catch (err) {
      console.error('Wallet connection failed:', err)
      if (err.code === 4001 || err.message?.includes('rejected')) {
        setError('User rejected the connection request')
      } else {
        setError(`Connection failed: ${err.message || 'Please try again'}`)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <>
      <div className="wallet-registration-overlay">
        {/* 80年代屏幕边框 */}
        <div className="screen-border top"></div>
        <div className="screen-border bottom"></div>
        <div className="screen-border left"></div>
        <div className="screen-border right"></div>
        
        {/* 星空闪烁效果 */}
        <div className="stars-container">
          {[...Array(60)].map((_, i) => (
            <div 
              key={i} 
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* 火焰粒子效果 */}
        <div className="flame-particles">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className="flame-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        {/* 能量球轨迹 */}
        <div className="energy-orbs-container">
          {[...Array(20)].map((_, i) => {
            const angle = (Math.random() * 360) * Math.PI / 180;
            const distance = 200 + Math.random() * 400;
            return (
              <div 
                key={i} 
                className="energy-orb"
                style={{
                  left: '50%',
                  top: '50%',
                  '--orbit-x': `${Math.cos(angle) * distance}px`,
                  '--orbit-y': `${Math.sin(angle) * distance}px`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 3}s`
                }}
              />
            );
          })}
        </div>
        
        {/* 光束效果 */}
        <div className="light-beams-container">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="light-beam"
              style={{
                left: `${15 + i * 20}%`,
                animationDelay: `${i * 0.6}s`
              }}
            />
          ))}
        </div>
        
        {/* 流星效果 */}
        <div className="flame-particles">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="meteor"
              style={{
                left: `${Math.random() * 50}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${1 + Math.random()}s`,
                animationIterationCount: 'infinite'
              }}
            />
          ))}
        </div>
        
        {/* 魔法圆环 */}
        <div className="magic-circles-container">
          {[800, 600, 400].map((size, i) => (
            <div 
              key={i} 
              className="magic-circle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${20 - i * 5}s`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
              }}
            />
          ))}
        </div>
        
        <div className="wallet-registration-box">
          {/* 马赛克装饰角 */}
          <div className="mosaic-corner top-left"></div>
          <div className="mosaic-corner top-right"></div>
          <div className="mosaic-corner bottom-left"></div>
          <div className="mosaic-corner bottom-right"></div>
          
          <img src="/logo.png" alt="TaixuChain Logo" className="logo-image" />
          
          <h2>
            <span className="title-fire">TAIXUCHAIN</span>
          </h2>
          <p>Connect your OneChain wallet to enter the world</p>
          
          {!walletAddress ? (
            <>
              <button 
                onClick={connectWallet} 
                disabled={isConnecting}
                className="connect-button"
              >
                {isConnecting ? 'Connecting...' : 'Connect OneChain Wallet'}
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation() // 阻止事件冒泡
                  e.preventDefault()
                  console.log('📖 Tutorial button clicked, setting showTutorial to true')
                  setShowTutorial(true)
                  setIsForcedTutorial(false) // 手动打开的不强制
                }}
                className="tutorial-button"
                type="button"
              >
                📖 Beginner Tutorial
              </button>
              
              {error && (
                <div className="error-message">
                  <button 
                    className="error-close-button"
                    onClick={() => setError('')}
                    aria-label="Close error message"
                  >
                    ×
                  </button>
                  <p>{error}</p>
                  {error.includes('install') && (
                    <a 
                      href="https://chromewebstore.google.com/detail/onechain/gclmcgmpkgblaglfokkaclneihpnbkli"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="install-link"
                      onClick={(e) => {
                        // 点击下载链接时也打开教程
                        setTimeout(() => setShowTutorial(true), 500)
                      }}
                    >
                      Install OneChain Wallet Extension
                    </a>
                  )}
                </div>
              )}
              
              {!providerReady && !error && (
                <p className="waiting-message">Detecting wallet extension...</p>
              )}
            </>
          ) : (
            <div className="success-message">
              <p>✓ Connected Successfully!</p>
              <p className="wallet-address">Wallet Address: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
              <p className="loading-message">Loading next scene...</p>
            </div>
          )}
        </div>
      </div>

      {showTutorial && (
        <WalletTutorial 
          onClose={() => {
            console.log('❌ Tutorial onClose called')
            setShowTutorial(false)
          }} 
          isForced={isForcedTutorial}
          onComplete={() => {
            // 完成教程后记录到 localStorage
            localStorage.setItem('taixuchain_tutorial_completed', 'true')
            setShowTutorial(false)
            setIsForcedTutorial(false)
            console.log('✅ Tutorial completed and saved to localStorage')
          }}
        />
      )}
    </>
  )
}

export default WalletRegistration
