import { useState, useEffect } from 'react'
import '../css/WalletRegistration.css'

function WalletRegistration({ onRegistrationSuccess }) {
  const [walletAddress, setWalletAddress] = useState(null)
  const [error, setError] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [providerReady, setProviderReady] = useState(false)

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
    <div className="wallet-registration-overlay">
      <div className="wallet-registration-box">
        <h2>Welcome to Taixu Chain</h2>
        <p>Please connect your OneChain wallet to start the game</p>
        
        {!walletAddress ? (
          <>
            <button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="connect-button"
            >
              {isConnecting ? 'Connecting...' : 'Connect OneChain Wallet'}
            </button>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
                {error.includes('install') && (
                  <a 
                    href="https://chromewebstore.google.com/detail/onechain/gclmcgmpkgblaglfokkaclneihpnbkli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="install-link"
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
  )
}

export default WalletRegistration
