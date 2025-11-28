import '../css/inventory.css'

function InventorySlot({ weapon, isSelected, onClick, isEquipped, canEquip }) {
  return (
    <div 
      className={`inventory-slot ${weapon ? 'has-item' : ''} ${isSelected ? 'selected' : ''} ${isEquipped ? 'equipped' : ''} ${weapon && canEquip === false ? 'cannot-equip' : ''}`}
      onClick={onClick}
      title={weapon && canEquip === false ? 'This weapon is not suitable for your class' : ''}
    >
      {weapon ? (
        <div className="slot-content">
          <img 
            src={getWeaponImage(weapon.name, weapon.weaponType)} 
            alt={weapon.name}
            className="weapon-icon-img"
          />
          <div className="weapon-level">Lv.{weapon.level}</div>
          {weapon && canEquip === false && (
            <div className="cannot-equip-icon">🚫</div>
          )}
        </div>
      ) : (
        <div className="slot-empty">
          <span className="empty-icon">+</span>
        </div>
      )}
    </div>
  )
}

// Get weapon image path
function getWeaponImage(weaponName, weaponType) {
  const typeFolder = {
    1: 'swords',
    2: 'bows',
    3: 'staves'
  }
  
  const folder = typeFolder[weaponType] || 'swords'
  return `/weapons/${folder}/${weaponName}.png`
}

export default InventorySlot
