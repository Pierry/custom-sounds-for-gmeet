import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Lexend';
import {Background} from './Background';
import {C} from './theme';

const {fontFamily} = loadFont();

const STEPS = [
  {n: 1, t: 'Download the repo', d: 'github.com/Pierry/custom-sounds-for-gmeet'},
  {n: 2, t: 'Open chrome://extensions', d: 'turn on Developer mode'},
  {n: 3, t: 'Load unpacked', d: 'select the extension folder'},
  {n: 4, t: 'Open a Meet call', d: 'a panel appears in the corner'},
  {n: 5, t: 'Configure sounds', d: 'click Learn once for raise hand'},
];

export const Install = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = spring({frame: f, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{fontFamily, color: C.on}}>
      <Background />
      <AbsoluteFill style={{padding: '72px 96px'}}>
        <div style={{opacity: title, transform: `translateY(${(1 - title) * 20}px)`}}>
          <div style={{fontSize: 56, fontWeight: 700, marginBottom: 6}}>How to install</div>
          <div style={{fontSize: 26, color: C.onv, marginBottom: 46}}>Custom Sounds for GMeet</div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          {STEPS.map((s, i) => {
            const delay = 26 + i * 64;
            const sp = spring({frame: f - delay, fps, config: {damping: 200}});
            const active = f >= delay && f < delay + 74;
            return (
              <div key={i} style={{display: 'flex', gap: 24, alignItems: 'center', opacity: sp, transform: `translateX(${(1 - sp) * 36}px)`}}>
                <div style={{width: 58, height: 58, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 27, fontWeight: 700, background: active ? C.primary : C.pc, color: active ? '#381e72' : C.opc}}>{s.n}</div>
                <div>
                  <div style={{fontSize: 33, fontWeight: 600}}>{s.t}</div>
                  <div style={{fontSize: 24, color: C.onv, marginTop: 2}}>{s.d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
