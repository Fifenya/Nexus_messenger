import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';

const fmtT = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({ src }: { src: string }) {
  const vRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ui, setUi] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const hideT = useRef<any>(null);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const poke = () => {
    setUi(true);
    clearTimeout(hideT.current);
    hideT.current = setTimeout(() => {
      if (vRef.current && !vRef.current.paused) setUi(false);
    }, 2500);
  };

  const toggle = () => {
    const v = vRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    poke();
  };

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else wrapRef.current?.requestFullscreen?.().catch(() => {});
    poke();
  };

  const seek = (e: React.PointerEvent) => {
    const v = vRef.current;
    if (!v || !dur) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * dur;
    setCur(v.currentTime);
    poke();
  };

  return (
    <div ref={wrapRef}
      className={`relative overflow-hidden bg-black ${fs ? 'w-full h-full flex items-center justify-center' : 'rounded-xl mb-1'}`}
      style={fs ? undefined : { maxWidth: 320 }}>
      <video
        ref={vRef}
        src={src}
        playsInline
        preload="metadata"
        className={fs ? 'w-full h-full' : 'w-full'}
        style={fs ? { objectFit: 'contain' } : { maxHeight: 320 }}
        onClick={toggle}
        onPlay={() => { setPlaying(true); poke(); }}
        onPause={() => { setPlaying(false); setUi(true); }}
        onTimeUpdate={e => setCur((e.target as HTMLVideoElement).currentTime)}
        onLoadedMetadata={e => setDur((e.target as HTMLVideoElement).duration)}
        onEnded={() => { setPlaying(false); setUi(true); }}
      />
      {(!playing || ui) && (
        <button className="absolute inset-0 m-auto w-16 h-16 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
          style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(6px)' }}
          onClick={toggle}>
          {playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>
      )}
      {ui && (
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-8"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.75))' }}>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} onPointerDown={seek}>
            <div className="h-full rounded-full" style={{ width: `${dur ? (cur / dur) * 100 : 0}%`, background: 'var(--color-accent)' }} />
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-white text-xs">
            <span className="tabular-nums">{fmtT(cur)} / {fmtT(dur)}</span>
            <span className="flex-1" />
            <button className="active:opacity-70" onClick={() => { const v = vRef.current; if (v) { v.muted = !muted; setMuted(!muted); } }}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button className="active:opacity-70" onClick={toggleFs}>
              {fs ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
