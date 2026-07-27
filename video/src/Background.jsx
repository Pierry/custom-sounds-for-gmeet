import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Animated aurora background matching the web app.
export const Background = () => {
  const f = useCurrentFrame();
  const blob = (x, y, size, color, phase, amp = 60) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    filter: 'blur(90px)',
    opacity: 0.55,
    mixBlendMode: 'screen',
    left: x + Math.sin((f + phase) / 40) * amp,
    top: y + Math.cos((f + phase) / 50) * amp,
  });
  return (
    <AbsoluteFill style={{background: '#141218'}}>
      <div style={blob(-140, -140, 580, '#6c4bd6', 0)} />
      <div style={blob(860, 420, 500, '#3b5bdb', 80)} />
      <div style={blob(560, 120, 420, '#b05bd6', 160)} />
    </AbsoluteFill>
  );
};
