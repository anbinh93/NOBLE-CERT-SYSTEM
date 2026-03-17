'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import {
  Play, Pause, Volume2, Volume1, VolumeX,
  Maximize2, Minimize2, Lock, CheckCircle, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { learningService } from '@/services/learning.service';
import { useSession } from 'next-auth/react';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface VideoPlayerProps {
  courseId: string;
  unitId: string;
  url: string;
  lastWatchedPosition?: number;
  onComplete?: () => void;
}

export const VideoPlayer = ({
  courseId,
  unitId,
  url,
  lastWatchedPosition = 0,
  onComplete,
}: VideoPlayerProps) => {
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken;

  const playerRef = useRef<InstanceType<typeof ReactPlayer>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<SpeedOption>(1);
  const [hasResumed, setHasResumed] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  // Progress
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const maxWatchedRef = useRef(lastWatchedPosition);
  const [maxWatched, setMaxWatched] = useState(lastWatchedPosition);

  // Audio
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // UI
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // ─── Auto-hide controls ─────────────────────────────────────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  useEffect(() => {
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, []);

  // ─── Fullscreen listener ────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Close speed menu on outside click
  useEffect(() => {
    if (!showSpeedMenu) return;
    const close = () => setShowSpeedMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showSpeedMenu]);

  // ─── Player callbacks ────────────────────────────────────────────────────
  const handleReady = useCallback(() => {
    if (!hasResumed && lastWatchedPosition > 1 && playerRef.current) {
      playerRef.current.seekTo(lastWatchedPosition, 'seconds');
      setHasResumed(true);
    }
  }, [hasResumed, lastWatchedPosition]);

  const handleProgress = useCallback(({ playedSeconds }: { playedSeconds: number }) => {
    setCurrentTime(playedSeconds);
    if (playedSeconds > maxWatchedRef.current) {
      maxWatchedRef.current = playedSeconds;
      setMaxWatched(playedSeconds);
    }
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    const limit = maxWatchedRef.current;
    if (seconds > limit + 2) {
      setTimeout(() => playerRef.current?.seekTo(limit, 'seconds'), 150);
      toast.warning('Không thể tua nhanh – hãy xem theo thứ tự.', {
        id: 'seek-block', duration: 2000,
      });
    }
  }, []);

  const handleEnded = async () => {
    setHasEnded(true);
    setIsPlaying(false);

    if (!accessToken) { toast.error('Phiên đăng nhập hết hạn.'); return; }

    try {
      // Lấy duration thực tế từ player (YouTube cung cấp qua getDuration)
      const actualDuration = playerRef.current?.getDuration?.() ?? duration;

      // Gửi heartbeat cuối với vị trí = toàn bộ duration để đảm bảo
      // backend có lastWatchedPosition chính xác trước khi kiểm tra hoàn thành
      await learningService.syncHeartbeat(courseId, unitId, actualDuration, 30, accessToken);

      // Gửi actualDuration để backend dùng duration thực tế thay vì DB metadata
      await learningService.completeUnit(courseId, unitId, accessToken, actualDuration);
      onComplete?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast.error(msg || 'Lỗi lưu tiến độ.');
    }
  };

  // ─── Heartbeat ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !accessToken) return;
    const id = setInterval(() => {
      const pos = playerRef.current?.getCurrentTime() ?? 0;
      learningService.syncHeartbeat(courseId, unitId, pos, 30, accessToken).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [isPlaying, courseId, unitId, accessToken]);

  // ─── Control actions ─────────────────────────────────────────────────────
  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);
  const toggleMute = useCallback(() => setIsMuted(m => !m), []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const handleSpeedChange = useCallback((rate: SpeedOption) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = (playerRef.current as any)?.getInternalPlayer?.();
      p?.setPlaybackRate?.(rate);
    } catch { /* ignore */ }
  }, []);

  const handleReplay = useCallback(() => {
    setHasEnded(false);
    playerRef.current?.seekTo(0, 'seconds');
    setIsPlaying(true);
  }, []);

  // ─── Progress bar click-to-seek ──────────────────────────────────────────
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const bar = progressBarRef.current;
    if (!bar || duration === 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = ratio * duration;
    const limit = maxWatchedRef.current;
    if (target > limit + 2) {
      toast.warning('Không thể tua nhanh – hãy xem theo thứ tự.', {
        id: 'seek-block', duration: 2000,
      });
      return;
    }
    playerRef.current?.seekTo(Math.min(target, limit), 'seconds');
  }, [duration]);

  // ─── Derived values ──────────────────────────────────────────────────────
  const watchedPct = duration > 0 ? Math.min(100, (maxWatched / duration) * 100) : 0;
  const currentPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  // Controls are always visible when paused; auto-hide only when playing
  const controlsVisible = showControls || !isPlaying;

  return (
    <div
      ref={containerRef}
      className="bg-foreground overflow-hidden rounded-[24px] border border-primary/20 shadow-[0_4px_20px_-5px_hsl(var(--primary)/0.2)] select-none"
      onMouseMove={() => { revealControls(); if (isPlaying) scheduleHide(); }}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
    >
      <div className="aspect-video relative bg-foreground">

        {/* ── YouTube iframe (no native controls) ───────────────────── */}
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          controls={false}
          playing={isPlaying}
          volume={isMuted ? 0 : volume}
          muted={isMuted}
          playbackRate={playbackRate}
          progressInterval={500}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onReady={handleReady}
          onEnded={handleEnded}
          onProgress={handleProgress}
          onDuration={setDuration}
          onSeek={handleSeek}
          config={{
            youtube: {
              playerVars: {
                showinfo: 0,
                rel: 0,
                modestbranding: 1,
                disablekb: 1,
                iv_load_policy: 3,
                controls: 0,
                fs: 0,
              },
            },
          }}
        />

        {/* ── Transparent click capture (above iframe, below controls) ─ */}
        <div
          className="absolute inset-0 z-[2] cursor-pointer"
          onClick={togglePlay}
        />

        {/* ── End-screen overlay ────────────────────────────────────── */}
        {hasEnded && (
          <div className="absolute inset-0 z-[20] bg-foreground/85 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-white font-serif text-xl font-medium">Đã hoàn thành bài học</p>
              <p className="text-white/50 text-sm mt-1">Tiến độ của bạn đã được lưu</p>
            </div>
            <button
              type="button"
              onClick={handleReplay}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20"
            >
              <RotateCcw className="w-4 h-4" />
              Xem lại
            </button>
          </div>
        )}

        {/* ── Custom controls overlay (bottom gradient) ─────────────── */}
        {!hasEnded && (
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-[10] transition-opacity duration-300',
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* gradient backdrop */}
            <div className="bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-10">

              {/* ── Progress bar ───────────────────────────────────── */}
              <div
                ref={progressBarRef}
                className="relative w-full h-1 cursor-pointer group/pb"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                onClick={handleProgressClick}
                // expand on hover via child elements
                onMouseEnter={e => (e.currentTarget.style.height = '5px')}
                onMouseLeave={e => (e.currentTarget.style.height = '4px')}
              >
                {/* max-watched (seekable range) */}
                <div
                  className="absolute inset-y-0 left-0 bg-white/30 pointer-events-none"
                  style={{ width: `${watchedPct}%` }}
                />
                {/* current position */}
                <div
                  className="absolute inset-y-0 left-0 bg-primary pointer-events-none"
                  style={{ width: `${currentPct}%` }}
                />
                {/* scrubber dot */}
                <div
                  className="absolute top-1/2 w-3 h-3 rounded-full bg-primary shadow-lg
                             opacity-0 group-hover/pb:opacity-100 transition-opacity pointer-events-none"
                  style={{ left: `${currentPct}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>

              {/* ── Buttons row ────────────────────────────────────── */}
              <div className="flex items-center gap-1.5 px-3 py-2">

                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="text-white hover:text-primary transition-colors p-1 shrink-0"
                  title={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                  {isPlaying
                    ? <Pause className="w-5 h-5 fill-current" />
                    : <Play className="w-5 h-5 fill-current" />}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1 group/vol">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="text-white/80 hover:text-white transition-colors p-0.5 shrink-0"
                    title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                  >
                    <VolumeIcon className="w-4 h-4" />
                  </button>
                  {/* slider expands on hover */}
                  <div className="w-0 group-hover/vol:w-16 overflow-hidden transition-all duration-200">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (v > 0) setIsMuted(false);
                      }}
                      className="w-16 accent-primary cursor-pointer block"
                      style={{ height: '3px' }}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Time */}
                <span className="text-white/60 text-[11px] font-mono tabular-nums shrink-0 ml-1">
                  {formatTime(currentTime)}&nbsp;/&nbsp;{formatTime(duration)}
                </span>

                <div className="flex-1" />

                {/* No-seek lock */}
                <div className="flex items-center gap-1 text-white/35 shrink-0">
                  <Lock className="w-3 h-3 text-primary/50" />
                  <span className="hidden lg:inline text-[11px]">Không tua được</span>
                </div>

                {/* Playback speed */}
                <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setShowSpeedMenu(s => !s)}
                    className="text-[11px] font-bold text-white/70 hover:text-white transition-colors
                               px-1.5 py-0.5 rounded border border-white/20 hover:border-white/50 min-w-[32px] text-center"
                  >
                    {playbackRate}×
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-1.5 bg-[#111] border border-white/15
                                    rounded-lg overflow-hidden shadow-2xl z-30 min-w-[60px]">
                      {SPEED_OPTIONS.map(rate => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleSpeedChange(rate)}
                          className={cn(
                            'block w-full px-3 py-1.5 text-[11px] text-center hover:bg-white/10 transition-colors',
                            playbackRate === rate
                              ? 'text-primary font-bold bg-primary/10'
                              : 'text-white/70',
                          )}
                        >
                          {rate}×
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="text-white/70 hover:text-white transition-colors p-0.5 shrink-0"
                  title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
                >
                  {isFullscreen
                    ? <Minimize2 className="w-4 h-4" />
                    : <Maximize2 className="w-4 h-4" />}
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VideoPlayer;
