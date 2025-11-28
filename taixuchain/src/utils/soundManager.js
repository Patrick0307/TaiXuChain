// 音效管理器
class SoundManager {
  constructor() {
    this.sounds = {}
    this.enabled = true
    this.bgm = null // 背景音乐
    this.bgmVolume = 0.3 // 背景音乐音量
  }

  // 加载音效
  loadSound(name, path) {
    const audio = new Audio(path)
    audio.preload = 'auto'
    this.sounds[name] = audio
  }

  // 播放音效
  play(name, volume = 1.0) {
    if (!this.enabled) {
      console.log('🔇 Sound disabled')
      return
    }
    if (!this.sounds[name]) {
      console.warn('🔇 Sound not found:', name)
      return
    }

    const sound = this.sounds[name].cloneNode()
    sound.volume = volume
    sound.play().then(() => {
      console.log('🔊 Playing sound:', name)
    }).catch(err => {
      console.warn('Failed to play sound:', name, err.message)
    })
  }

  // 随机播放一组音效中的一个
  playRandom(names, volume = 1.0) {
    if (!this.enabled || !names || names.length === 0) return
    const randomIndex = Math.floor(Math.random() * names.length)
    this.play(names[randomIndex], volume)
  }

  // 根据职业播放武器攻击音效
  playWeaponAttack(characterClass, volume = 0.6) {
    const classLower = characterClass?.toLowerCase()
    console.log('🔊 Playing weapon attack sound for class:', classLower)
    switch (classLower) {
      case 'warrior':
        this.playRandom(['sword1', 'sword2', 'sword3'], volume)
        break
      case 'archer':
        this.playRandom(['arrow1', 'arrow2'], volume)
        break
      case 'mage':
        this.playRandom(['stave1', 'stave2'], volume)
        break
      default:
        console.warn('Unknown character class for weapon sound:', characterClass)
    }
  }

  // 播放怪物攻击音效
  playMonsterAttack(volume = 0.5) {
    this.play('monsterattack', volume)
  }

  // 播放背景音乐（循环）
  playBGM(volume = 0.3) {
    if (this.bgm) {
      // 如果已经在播放，不重复播放
      if (!this.bgm.paused) return
    }
    
    this.bgmVolume = volume
    this.bgm = new Audio('/sounds/background.mp3')
    this.bgm.loop = true
    this.bgm.volume = volume
    this.bgm.play().then(() => {
      console.log('🎵 Background music started')
    }).catch(err => {
      console.warn('Failed to play BGM:', err.message)
    })
  }

  // 停止背景音乐
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
      console.log('🎵 Background music stopped')
    }
  }

  // 暂停背景音乐
  pauseBGM() {
    if (this.bgm && !this.bgm.paused) {
      this.bgm.pause()
      console.log('🎵 Background music paused')
    }
  }

  // 恢复背景音乐
  resumeBGM() {
    if (this.bgm && this.bgm.paused) {
      this.bgm.play().catch(err => {
        console.warn('Failed to resume BGM:', err.message)
      })
    }
  }

  // 设置背景音乐音量
  setBGMVolume(volume) {
    this.bgmVolume = volume
    if (this.bgm) {
      this.bgm.volume = volume
    }
  }

  // 启用/禁用音效
  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled && this.bgm) {
      this.bgm.pause()
    } else if (enabled && this.bgm && this.bgm.paused) {
      this.bgm.play().catch(() => {})
    }
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

// 预加载武器音效 - 剑（战士）
soundManager.loadSound('sword1', '/sounds/weapon/sword/sword1.mp3')
soundManager.loadSound('sword2', '/sounds/weapon/sword/sword2.mp3')
soundManager.loadSound('sword3', '/sounds/weapon/sword/sword3.mp3')

// 预加载武器音效 - 弓（弓箭手）
soundManager.loadSound('arrow1', '/sounds/weapon/bow/arrow1.mp3')
soundManager.loadSound('arrow2', '/sounds/weapon/bow/arrow2.mp3')

// 预加载武器音效 - 法杖（法师）
soundManager.loadSound('stave1', '/sounds/weapon/stave/Stave1.mp3')
soundManager.loadSound('stave2', '/sounds/weapon/stave/Stave2.mp3')

// 预加载怪物攻击音效
soundManager.loadSound('monsterattack', '/sounds/monsterattack1.mp3')

export default soundManager
