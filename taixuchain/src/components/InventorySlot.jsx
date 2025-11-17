import '../css/inventory.css'

function InventorySlot({ weapon, isSelected, onClick }) {
  return (
    <div 
      className={`inventory-slot ${weapon ? 'has-item' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {weapon ? (
        <div className="slot-content">
          <div className="weapon-icon">
            {getWeaponIcon(weapon.weaponType)}
          </div>
          <div className="weapon-level">Lv.{weapon.level}</div>
        </div>
      ) : (
        <div className="slot-empty">
          <span className="empty-icon">+</span>
        </div>
      )}
    </div>
  )
}

// 获取武器图标
function getWeaponIcon(weaponType) {
  const icons = {
    1: '⚔️', // Sword
    2: '🏹', // Bow
    3: '🪄'  // Staff
  }
  return icons[weaponType] || '❓'
}

export default InventorySlot
