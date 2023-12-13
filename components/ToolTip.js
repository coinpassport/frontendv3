import {useState} from 'react';

const TooltipIcon = ({ message, id }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)} // Handle touch event
      onTouchEnd={() => setShowTooltip(false)}  // Handle touch event
      tabIndex="0"
    >
      <button aria-describedby={id}>?</button>
      {showTooltip && <div id={id} className="tooltip-message">{message}</div>}
    </div>
  );
};

export default TooltipIcon;

