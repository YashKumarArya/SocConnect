import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

const Attacks = [
  { order: 1, size: 0.5, color: 'red' },
  { order: 2, size: 0.3, color: 'orange' },
  { order: 3, size: 0.7, color: 'yellow' },
  { order: 4, size: 0.4, color: 'green' },
  { order: 5, size: 0.6, color: 'blue' },
  { order: 6, size: 0.2, color: 'purple' },
  { order: 7, size: 0.9, color: 'pink' },
  { order: 8, size: 0.1, color: 'brown' },
  { order: 9, size: 0.8, color: 'gray' },
  { order: 10, size: 0.5, color: 'cyan' },
];

function createNewAttack() {
  const newAttack = Attacks[Math.floor(Math.random() * Attacks.length)];
  return {
    ...newAttack,
    startLat: Math.random() * 180 - 90,
    startLng: Math.random() * 360 - 180,
    endLat: Math.random() * 180 - 90,
    endLng: Math.random() * 360 - 180,
  };
}

function GlobalThreatGlobe() {
  const [attacks, setAttacks] = useState([createNewAttack()]);
  const globeEl = useRef<any>();

  useEffect(() => {
    const interval = setInterval(() => {
      setAttacks(prev => {
        // Limit the number of attacks to prevent infinite growth
        const newAttacks = [...prev, createNewAttack()];
        return newAttacks.length > 20 ? newAttacks.slice(-20) : newAttacks;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-rotate globe
    if (globeEl.current && globeEl.current.controls) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.1;
    }
  }, []);

  return (
    <Globe
      ref={globeEl}
      arcsData={attacks}
      animateIn={true}
      arcColor={d => d.color}
      arcStrokeWidth={d => d.size}
      arcDashLength={0.4}
      arcDashGap={0.2}
      arcLabel={d => `${d.size * 100} Mbps`}
      arcStartLat={d => d.startLat}
      arcStartLng={d => d.startLng}
      arcEndLat={d => d.endLat}
      arcEndLng={d => d.endLng}
       atmosphereColor="#233A5B"
      backgroundColor="rgba(0,0,0,0)"
      pointsData={[{ lat: 10, lng: 10, size: 10, color: 'red' }]}
      pointColor={d => d.color}
      pointAltitude={d => d.size}
      pointLabel={d => `${d.size * 100} Mbps`}
    />
  );
}

export default GlobalThreatGlobe;