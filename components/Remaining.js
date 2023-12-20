
import React, { useState, useEffect } from 'react';


export function Remaining({ value, onlyFirst }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(tick => tick + 1); // Update the state to trigger re-render
    }, 1000);

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);


  return (<>
    {remaining(Number(value) - Math.round(Date.now() / 1000), onlyFirst)}
  </>);
}

export function remaining(seconds, onlyFirst) {
  const units = [
    { value: 1, unit: 'second' },
    { value: 60, unit: 'minute' },
    { value: 60 * 60, unit: 'hour' },
    { value: 60 * 60 * 24, unit: 'day' },
  ];
  let remaining = Number(seconds);
  let out = [];
  for(let i = units.length - 1; i >= 0;  i--) {
    if(remaining >= units[i].value) {
      const count = Math.floor(remaining / units[i].value);
      out.push(count.toString(10) + ' ' + units[i].unit + (count !== 1 ? 's' : ''));
      if(onlyFirst) return out[0];
      remaining = remaining - (count * units[i].value);
    }
  }
  return out.join(', ');
}
