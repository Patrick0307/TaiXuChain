// Sound Manager
class SoundManager {
  constructor() {
    this.sounds = {}
    this.enabled = true
    this.bgm = null // Background music
    this.bgmVolume = 0.3 // Background music volume
  }

  // Load sound
  loadSound(name, path) {
    const audio = new Audio(path)
    audio.preload = 'auto'
    this.sounds[name] = audio
  }

  // Play sound
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

  // Randomly play one sound from a group
  playRandom(names, volume = 1.0) {
    if (!this.enabled || !names || names.length === 0) return
    const randomIndex = Math.floor(Math.random() * names.length)
    this.play(names[randomIndex], volume)
  }

  // Play weapon attack sound based on character class
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

  // Play monster attack sound
  playMonsterAttack(volume = 0.5) {
    this.play('monsterattack', volume)
  }

  // Play background music (loop)
  playBGM(volume = 0.3) {
    if (this.bgm) {
      // If already playing, don't play again
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

  // Stop background music
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
      console.log('🎵 Background music stopped')
    }
  }

  // Pause background music
  pauseBGM() {
    if (this.bgm && !this.bgm.paused) {
      this.bgm.pause()
      console.log('🎵 Background music paused')
    }
  }

  // Resume background music
  resumeBGM() {
    if (this.bgm && this.bgm.paused) {
      this.bgm.play().catch(err => {
        console.warn('Failed to resume BGM:', err.message)
      })
    }
  }

  // Set background music volume
  setBGMVolume(volume) {
    this.bgmVolume = volume
    if (this.bgm) {
      this.bgm.volume = volume
    }
  }

  // Enable/disable sound effects
  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled && this.bgm) {
      this.bgm.pause()
    } else if (enabled && this.bgm && this.bgm.paused) {
      this.bgm.play().catch(() => {})
    }
  }

  // Check if enabled
  isEnabled() {
    return this.enabled
  }
}

// Create global singleton
const soundManager = new SoundManager()

// Preload click sound
soundManager.loadSound('click', '/sounds/click1.mp3')

// Preload weapon sounds - Sword (Warrior)
soundManager.loadSound('sword1', '/sounds/weapon/sword/sword1.mp3')
soundManager.loadSound('sword2', '/sounds/weapon/sword/sword2.mp3')
soundManager.loadSound('sword3', '/sounds/weapon/sword/sword3.mp3')

// Preload weapon sounds - Bow (Archer)
soundManager.loadSound('arrow1', '/sounds/weapon/bow/arrow1.mp3')
soundManager.loadSound('arrow2', '/sounds/weapon/bow/arrow2.mp3')

// Preload weapon sounds - Staff (Mage)
soundManager.loadSound('stave1', '/sounds/weapon/stave/Stave1.mp3')
soundManager.loadSound('stave2', '/sounds/weapon/stave/Stave2.mp3')

// Preload monster attack sound
soundManager.loadSound('monsterattack', '/sounds/monsterattack1.mp3')

export default soundManager
