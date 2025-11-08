import WarriorCharacter from './characters/WarriorCharacter'
import ArcherCharacter from './characters/ArcherCharacter'
import MageCharacter from './characters/MageCharacter'

function PixelCharacter({ classId, gender, customization, scale = 2 }) {
  if (classId === 'warrior') {
    return <WarriorCharacter gender={gender} customization={customization} scale={scale} />
  } else if (classId === 'archer') {
    return <ArcherCharacter gender={gender} customization={customization} scale={scale} />
  } else if (classId === 'mage') {
    return <MageCharacter gender={gender} customization={customization} scale={scale} />
  }
  
  return null
}

export default PixelCharacter
