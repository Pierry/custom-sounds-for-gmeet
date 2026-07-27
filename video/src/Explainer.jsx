import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Lexend';
import {Background} from './Background';
import {C} from './theme';

const {fontFamily} = loadFont();

const Center = ({children}) => (
  <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 80}}>
    <div>{children}</div>
  </AbsoluteFill>
);

const Appear = ({delay = 0, y = 24, children}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - delay, fps, config: {damping: 200}});
  return <div style={{opacity: s, transform: `translateY(${(1 - s) * y}px)`}}>{children}</div>;
};

const Wave = () => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', gap: 8, alignItems: 'center', height: 130, justifyContent: 'center'}}>
      {Array.from({length: 26}).map((_, i) => {
        const h = 26 + Math.abs(Math.sin(f / 6 + i * 0.5)) * 92;
        return <div key={i} style={{width: 8, height: h, borderRadius: 8, background: i % 2 ? C.accent2 : C.primary, opacity: 0.9}} />;
      })}
    </div>
  );
};

export const Explainer = () => {
  return (
    <AbsoluteFill style={{fontFamily, color: C.on}}>
      <Background />

      <Sequence durationInFrames={95}>
        <Center>
          <Appear><div style={{fontSize: 76, fontWeight: 700, letterSpacing: -1}}>Custom Sounds for GMeet</div></Appear>
          <Appear delay={12}><div style={{fontSize: 34, color: C.onv, marginTop: 18}}>Your sounds in Google Meet. In 3D.</div></Appear>
        </Center>
      </Sequence>

      <Sequence from={95} durationInFrames={110}>
        <Center>
          <Appear><div style={{fontSize: 30, color: C.onv, marginBottom: 28}}>Replace the sound for</div></Appear>
          <div style={{display: 'flex', gap: 24, justifyContent: 'center'}}>
            {['Join', 'Leave', 'Raise hand'].map((t, i) => (
              <Appear key={t} delay={10 + i * 10}>
                <div style={{background: C.surface, border: `1px solid ${C.outline}`, borderRadius: 20, padding: '26px 30px', fontSize: 30, fontWeight: 600, minWidth: 170}}>{t}</div>
              </Appear>
            ))}
          </div>
          <Appear delay={52}><div style={{fontSize: 30, marginTop: 34}}>with anything you want</div></Appear>
        </Center>
      </Sequence>

      <Sequence from={205} durationInFrames={95}>
        <Center>
          <Appear><div style={{fontSize: 62, fontWeight: 700}}>3D spatial audio</div></Appear>
          <Appear delay={12}><div style={{fontSize: 30, color: C.onv, marginTop: 14, marginBottom: 30}}>Orbit, fly by, approach. Best on headphones.</div></Appear>
          <Appear delay={20}><Wave /></Appear>
        </Center>
      </Sequence>

      <Sequence from={300} durationInFrames={60}>
        <Center>
          <Appear><div style={{fontSize: 30, color: C.onv}}>A lightweight Chrome extension</div></Appear>
          <Appear delay={10}><div style={{fontSize: 38, fontWeight: 700, marginTop: 16, color: C.primary}}>pierry.github.io/custom-sounds-for-gmeet</div></Appear>
        </Center>
      </Sequence>
    </AbsoluteFill>
  );
};
