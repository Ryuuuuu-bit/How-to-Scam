import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';

export function AudioControls() {
  const [settings, setSettings] = useState(audio.settings);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      void audio.unlock().then(() => {
        if ((event.target as HTMLElement).closest('button:not(:disabled), a, input'))
          audio.play('click');
      });
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') void audio.unlock();
    };
    const visibility = () => audio.visibility();
    document.addEventListener('click', click);
    document.addEventListener('keydown', keyboard);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('click', click);
      document.removeEventListener('keydown', keyboard);
      document.removeEventListener('visibilitychange', visibility);
      audio.stop();
    };
  }, []);
  const update = (next: typeof settings) => {
    setSettings(next);
    audio.update(next);
  };
  return (
    <aside className="audio-controls" aria-label="ตั้งค่าเสียง">
      <button
        className="audio-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="sound-settings"
        aria-label="ตั้งค่าเสียงเพลงและเอฟเฟกต์"
      >
        <span aria-hidden>{settings.muted ? '♪ ×' : '♫'}</span>
        <span>เสียง</span>
      </button>
      {open && (
        <div className="audio-panel" id="sound-settings">
          <div className="audio-heading">
            เสียงในเมือง
            <button onClick={() => setOpen(false)} aria-label="ปิดตั้งค่าเสียง">
              ×
            </button>
          </div>
          <label htmlFor="music-volume">
            เพลงประกอบ <span>{Math.round(settings.music * 100)}%</span>
          </label>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.music}
            onChange={(e) => update({ ...settings, music: Number(e.target.value) })}
          />
          <label htmlFor="effects-volume">
            เอฟเฟกต์ <span>{Math.round(settings.effects * 100)}%</span>
          </label>
          <input
            id="effects-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.effects}
            onChange={(e) => update({ ...settings, effects: Number(e.target.value) })}
          />
          <button
            className="sound-mute"
            aria-pressed={settings.muted}
            onClick={() => update({ ...settings, muted: !settings.muted })}
          >
            {settings.muted ? 'เปิดเสียงทั้งหมด' : 'ปิดเสียงทั้งหมด'}
          </button>
          <p>เพลงจะเริ่มเมื่อกดเล่น และพักเมื่อออกจากแท็บ</p>
        </div>
      )}
    </aside>
  );
}
