// 音效管理器
class SoundManager {
  constructor() {
    this.sounds = {}
    this.enabled = true
  }

  // 加载音效
  loadSound(name, path) {
    const audio = new Audio(path)
    audio.preload = 'auto'
    this.sounds[name] = audio
  }

  // 播放音效
  play(name, volume = 1.0) {
    if (!this.enabled || !this.sounds[name]) return

    const sound = this.sounds[name].cloneNode()
    sound.volume = volume
    sound.play().catch(err => {
      console.warn('Failed to play sound:', err)
    })
  }

  // 启用/禁用音效
  setEnabled(enabled) {
    this.enabled = enabled
  }

  // 检查是否启用
  isEnabled() {
    return this.enabled
  }
}

// 创建全局单例
const soundManager = new SoundManager()

// 预加载点击音效
soundManager.loadSound('click', '/sounds/click1.mp3')

export default soundManager
