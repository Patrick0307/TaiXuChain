function UIDDisplay({ walletAddress }) {
  if (!walletAddress) return null

  const style = {
    position: 'fixed',
    bottom: '8px',
    right: '10px',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '8px',
    fontFamily: 'monospace',
    zIndex: 9999,
    pointerEvents: 'none',
    userSelect: 'none'
  }

  return (
    <div style={style}>
      {walletAddress}
    </div>
  )
}

export default UIDDisplay
