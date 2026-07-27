import {Composition} from 'remotion';
import {Explainer} from './Explainer';
import {Install} from './Install';

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="Explainer" component={Explainer} durationInFrames={360} fps={30} width={1280} height={720} />
      <Composition id="Install" component={Install} durationInFrames={450} fps={30} width={1280} height={720} />
    </>
  );
};
