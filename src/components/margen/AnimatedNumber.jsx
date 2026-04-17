import React, { useState, useEffect } from 'react';

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = parseInt(value);
    if (start === end) return;

    let totalDuration = 400; // ms
    let startTime = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / totalDuration, 1);
      const current = Math.floor(progress * (end - start) + start);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toLocaleString('es-ES')}</span>;
};

export default AnimatedNumber;
