import { useState, useEffect } from 'react'
import '../css/GameLoading.css'
import AnimatedCharacter from './AnimatedCharacter'

function GameLoading() {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)

  const loadingStages = [
    { text: 'Waking up cold server...', duration: 3000, progress: 25 },
    { text: 'Checking existing character...', duration: 2000, progress: 50 },
    { text: 'Rendering game world...', duration: 2000, progress: 75 },
    { text: 'Almost ready...', duration: 1500, progress: 100 }
  ]

  // 三个角色配置
  const characters = [
    {
      id: 'warrior',
      name: 'Warrior',
      customization: {
        gender: 'male',
        skinColor: '#ffd4a3',
        hairStyle: 'short',
        hairColor: '#000000',
        clothesStyle: 'default',
        clothesColor: '#8b0000',
        shoesColor: '#4a4a4a'
      }
    },
    {
      id: 'archer',
      name: 'Archer',
      customization: {
        gender: 'male',
        skinColor: '#ffd4a3',
        hairStyle: 'short',
        hairColor: '#000000',
        clothesStyle: 'default',
        clothesColor: '#228b22',
        shoesColor: '#4a4a4a'
      }
    },
    {
      id: 'mage',
      name: 'Mage',
      customization: {
        gender: 'male',
        skinColor: '#ffd4a3',
        hairStyle: 'short',
        hairColor: '#000000',
        clothesStyle: 'default',
        clothesColor: '#4b0082',
        shoesColor: '#4a4a4a'
      }
    }
  ]

  useEffect(() => {
    let stageIndex = 0
    let progressValue = 0

    const updateProgress = () => {
      if (stageIndex < loadingStages.length) {
        const stage = loadingStages[stageIndex]
        const increment = (stage.progress - progressValue) / (stage.duration / 50)
        
        const interval = setInterval(() => {
          progressValue += increment
          if (progressValue >= stage.progress) {
            progressValue = stage.progress
            clearInterval(interval)
            stageIndex++
            setCurrentStage(stageIndex)
            if (stageIndex < loadingStages.length) {
              updateProgress()
            }
          }
          setProgress(Math.min(progressValue, 100))
        }, 50)
      }
    }

    updateProgress()
  }, [])

  return (
    <div className="game-loading">
      {/* 马赛克背景效果 */}
      <div className="mosaic-background"></div>
      
      <div className="loading-content">
        {/* 标题 */}
        <h1 className="loading-title">
          <span className="title-text">TAIXU</span>
          <span className="title-glow"></span>
        </h1>

        {/* 进度条容器 */}
        <div className="progress-container">
          <div className="progress-bar-wrapper">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            >
              <div className="progress-shine"></div>
            </div>
            <div className="progress-border"></div>
          </div>
          <div className="progress-text">{Math.floor(progress)}%</div>
        </div>

        {/* 加载状态文字 */}
        <div className="loading-stage">
          {currentStage < loadingStages.length && (
            <p className="stage-text">{loadingStages[currentStage].text}</p>
          )}
        </div>

        {/* 底部三个角色 */}
        <div className="characters-showcase">
          {characters.map((char, index) => (
            <div 
              key={char.id} 
              className="character-item"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="character-wrapper">
                <AnimatedCharacter 
                  character={char}
                  scale={1.5}
                />
              </div>
              <div className="character-label">{char.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GameLoading
