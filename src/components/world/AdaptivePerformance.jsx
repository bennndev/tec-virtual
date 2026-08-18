import { useRef } from 'react';
import { PerformanceMonitor, AdaptiveEvents } from '@react-three/drei';
import useStore from '../../store/useStore';

function qualityFromFactor(factor) {
  return {
    factor,
    dpr: Math.round((0.85 + factor * 0.65) * 20) / 20,
    shadows: factor >= 0.3,
    shadowSize: factor >= 0.7 ? 1024 : 512,
    aa: factor >= 0.55,
  };
}

export default function AdaptivePerformance() {
  const lastFactor = useRef(1);

  return (
    <PerformanceMonitor
      bounds={(refresh) => (refresh > 90 ? [50, 85] : [42, 58])}
      flipflops={4}
      factor={1}
      onFallback={() => {
        lastFactor.current = 0.2;
        useStore.getState().setRenderQuality(qualityFromFactor(0.2));
      }}
      onChange={({ factor }) => {
        if (Math.abs(factor - lastFactor.current) < 0.05) return;
        lastFactor.current = factor;
        useStore.getState().setRenderQuality(qualityFromFactor(factor));
      }}
    >
      <AdaptiveEvents />
    </PerformanceMonitor>
  );
}
