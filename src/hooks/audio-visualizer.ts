/**
 * Samples the local microphone into 16 bars (12-100) on every animation frame.
 * Returns the AudioContext so the caller can close it, or null when Web Audio is unavailable.
 */
export function startFrequencyVisualizer(
  mediaStreamTrack: MediaStreamTrack | undefined,
  onSample: (bars: number[]) => void,
  onFrameScheduled: (frameId: number) => void
): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    const audioCtx: AudioContext = new AudioCtx();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;

    if (mediaStreamTrack) {
      const source = audioCtx.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
      source.connect(analyser);
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const render = () => {
      analyser.getByteFrequencyData(dataArray);
      const sampled: number[] = [];
      for (let i = 0; i < 16; i++) {
        const val = dataArray[i * 2] || 0;
        sampled.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
      }
      onSample(sampled);
      onFrameScheduled(requestAnimationFrame(render));
    };
    render();
    return audioCtx;
  } catch (e) {
    console.warn("Could not start Web Audio visualizer:", e);
    return null;
  }
}
