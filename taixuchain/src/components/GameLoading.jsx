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
      
      {/* 粒子特效容器 */}
      <div className="particles-container">
        {/* 星空闪烁 */}
        {[...Array(50)].map((_, i) => (
          <div 
            key={`star-${i}`}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* 金色粒子上升 */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={`particle-${i}`}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
        
        {/* 能量球轨迹 */}
        {[...Array(15)].map((_, i) => {
          const angle = (Math.random() * 360) * Math.PI / 180;
          const distance = 200 + Math.random() * 300;
          return (
            <div 
              key={`orb-${i}`}
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
        
        {/* 流星效果 */}
        {[...Array(5)].map((_, i) => (
          <div 
            key={`meteor-${i}`}
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
        
        {/* 光束效果 */}
        {[...Array(4)].map((_, i) => (
          <div 
            key={`beam-${i}`}
            className="light-beam"
            style={{
              left: `${20 + i * 25}%`,
              animationDelay: `${i * 0.75}s`
            }}
          />
        ))}
      </div>
      
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
          <p className="stage-text">
            {progress >= 100 ? 'Waking up cold server...' : loadingStages[currentStage]?.text}
          </p>
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
                  scale={1.8}
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
