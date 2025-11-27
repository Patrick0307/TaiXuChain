# Black & Gold Notification System - Usage Guide

## Overview
A beautiful black and gold themed notification system with pixel-art style borders and glowing effects, perfectly matching your game's UI design.

## Features
- ✨ Black & Gold theme with pixel-art borders
- 🎨 4 notification types: Success, Error, Warning, Info
- ⏱️ Auto-dismiss with progress bar
- 🎭 Smooth animations and glow effects
- 📱 Responsive design
- 🔔 Confirm dialogs for important actions

## Basic Usage

### 1. Import the notification manager
```javascript
import { notificationManager } from './components/Notification'
```

### 2. Show notifications

#### Success Notification
```javascript
notificationManager.success(
  'Success',
  'Item purchased successfully!',
  5000 // duration in ms (optional, default: 5000)
)
```

#### Error Notification
```javascript
notificationManager.error(
  'Error',
  'Failed to connect to server',
  5000
)
```

#### Warning Notification
```javascript
notificationManager.warning(
  'Warning',
  'Low health! Find a safe place',
  5000
)
```

#### Info Notification
```javascript
notificationManager.info(
  'Info',
  'New quest available in the village',
  5000
)
```

### 3. Custom duration
```javascript
// Show for 3 seconds
notificationManager.success('Quick Message', 'This will disappear quickly', 3000)

// Show indefinitely (user must close manually)
notificationManager.info('Important', 'Click X to close', 0)
```

## Confirm Dialog Usage

### 1. Import the component
```javascript
import { ConfirmDialog } from './components/Notification'
```

### 2. Use in your component
```javascript
function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    // Perform the action
    console.log('Confirmed!')
    setShowConfirm(false)
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  return (
    <>
      <button onClick={handleDelete}>Delete Item</button>
      
      <ConfirmDialog
        isOpen={showConfirm}
        type="warning" // 'warning', 'error', or 'info'
        title="Confirm Delete"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
```

## Real-World Examples

### Inventory System
```javascript
// When equipping an item
notificationManager.success(
  'Equipped',
  `${weaponName} equipped successfully!`
)

// When inventory is full
notificationManager.warning(
  'Inventory Full',
  'Cannot pick up more items. Sell or drop items first.'
)

// When item cannot be equipped
notificationManager.error(
  'Cannot Equip',
  'Your level is too low to equip this weapon.'
)
```

### Marketplace
```javascript
// Purchase success
notificationManager.success(
  'Purchase Complete',
  `You bought ${itemName} for ${price} LingStone`
)

// Insufficient funds
notificationManager.error(
  'Insufficient Funds',
  `You need ${required} LingStone but only have ${current}`
)

// Item listed
notificationManager.info(
  'Listed',
  `${itemName} is now available in the marketplace`
)
```

### Combat System
```javascript
// Level up
notificationManager.success(
  'Level Up!',
  `Congratulations! You reached level ${newLevel}`
)

// Low health warning
notificationManager.warning(
  'Low Health',
  'Your HP is below 20%. Use a potion or retreat!'
)

// Player defeated
notificationManager.error(
  'Defeated',
  'You have been defeated. Respawning at checkpoint...'
)
```

### Blockchain Transactions
```javascript
// Transaction pending
notificationManager.info(
  'Transaction Pending',
  'Please wait while your transaction is being processed...',
  0 // Don't auto-dismiss
)

// Transaction success
notificationManager.success(
  'Transaction Complete',
  'Your transaction has been confirmed on the blockchain'
)

// Transaction failed
notificationManager.error(
  'Transaction Failed',
  'Transaction was rejected. Please try again.'
)
```

## Styling Customization

The notification system uses CSS variables for easy customization. You can override these in your own CSS:

```css
.notification {
  /* Adjust border width */
  border-width: 3px;
  
  /* Adjust glow intensity */
  box-shadow: 0 0 60px rgba(255, 215, 0, 0.6);
}

/* Custom notification type */
.notification.custom {
  border-color: rgba(138, 43, 226, 0.7);
}
```

## Tips

1. **Keep messages concise**: Users should understand the message at a glance
2. **Use appropriate types**: Match the notification type to the message severity
3. **Don't spam**: Avoid showing too many notifications at once
4. **Important actions**: Use confirm dialogs for destructive or irreversible actions
5. **Duration**: Use shorter durations (3s) for simple messages, longer (7s) for complex ones

## Integration with Existing Components

The notification system is already integrated into your App.jsx. Just import and use the `notificationManager` anywhere in your app:

```javascript
// In any component
import { notificationManager } from '../components/Notification'

function handleAction() {
  try {
    // Your code here
    notificationManager.success('Success', 'Action completed!')
  } catch (error) {
    notificationManager.error('Error', error.message)
  }
}
```

## Advanced: Manual Control

```javascript
// Get notification ID
const notifId = notificationManager.show({
  type: 'info',
  title: 'Loading',
  message: 'Please wait...',
  duration: 0 // Don't auto-dismiss
})

// Later, manually remove it
notificationManager.remove(notifId)
```

Enjoy your beautiful black & gold notification system! 🎮✨
