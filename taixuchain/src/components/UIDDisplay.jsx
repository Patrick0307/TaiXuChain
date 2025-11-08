import '../css/UIDDisplay.css'

function UIDDisplay({ walletAddress }) {
  if (!walletAddress) return null

  return (
    <div className="uid-display">
      <span className="uid-label">UID:</span>
      <span className="uid-address">
        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </span>
    </div>
  )
}

export default UIDDisplay
