import '../css/inventory.css'

function InventorySlot({ weapon, isSelected, onClick, isEquipped, canEquip }) {
  return (
    <div 
      className={`inventory-slot ${weapon ? 'has-item' : ''} ${isSelected ? 'selected' : ''} ${isEquipped ? 'equipped' : ''} ${weapon && canEquip === false ? 'cannot-equip' : ''}`}
      onClick={onClick}
      title={weapon && canEquip === false ? '此武器不适合你的职业' : ''}
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

// 获取武器图片路径
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
