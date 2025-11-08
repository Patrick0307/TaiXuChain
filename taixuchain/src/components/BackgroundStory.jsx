import { useState, useRef } from 'react'
import WalletRegistration from './WalletRegistration'
import '../css/BackgroundStory.css'

function BackgroundStory({ onWalletConnected }) {
  const [currentVideo, setCurrentVideo] = useState(1)
  const [showRegistration, setShowRegistration] = useState(false)
  const videoRef = useRef(null)

  const handleVideoEnd = () => {
    if (currentVideo === 1) {
      // Video1 播完，播放 Video2
      setCurrentVideo(2)
      setShowRegistration(true)
    } else if (currentVideo === 3) {
      // Video3 播完后可以做其他处理
      console.log('所有视频播放完成')
    }
  }

  const handleRegistrationSuccess = (walletAddress) => {
    console.log('玩家钱包 ID:', walletAddress)
    onWalletConnected(walletAddress)
    setShowRegistration(false)
    // 注册成功，播放 Video3
    setCurrentVideo(3)
  }

  const getVideoSource = () => {
    switch (currentVideo) {
      case 1:
        return '/videos/TestingVideo1.mp4'
      case 2:
        return '/videos/TestingVideo2.mp4'
      case 3:
        return '/videos/TestingVideo3.mp4'
      default:
        return '/videos/TestingVideo1.mp4'
    }
  }

  const handleSkip = () => {
    setCurrentVideo(2)
    setShowRegistration(true)
  }

  return (
    <div className="background-story">
      <video
        ref={videoRef}
        src={getVideoSource()}
        onEnded={handleVideoEnd}
        autoPlay
        loop={currentVideo === 2}
        muted
        className="background-video"
      />

      {!showRegistration && currentVideo === 1 && (
        <button className="skip-button" onClick={handleSkip}>
          Skip
        </button>
      )}

      {showRegistration && (
        <WalletRegistration onRegistrationSuccess={handleRegistrationSuccess} />
      )}
    </div>
  )
}

export default BackgroundStory
