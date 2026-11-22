import { useState } from 'react';
import { content } from '@hts/shared/data';
import { sceneUrl } from '../assets/art';
import { Art, Button, Panel, ScreenTitle } from '../components/ui';
import {
  cosmeticUnlocked,
  loadCosmetics,
  menuScenes,
  saveCosmetics,
  skins,
} from '../game/cosmetics';
import { progressFor } from '../game/meta';
import { useAuth } from '../net/auth';
import { lt } from '../i18n';

export function WardrobeScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const progress = progressFor(user);
  const [selected, setSelected] = useState(() => loadCosmetics(progress, user?.uid));
  const [saved, setSaved] = useState(true);
  return (
    <main className="collection-screen mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-6">
      <ScreenTitle
        title="ห้องแต่งตัว"
        hint={`สะสมแล้ว ${progress.xp.toLocaleString('th-TH')} XP · เปลี่ยนภาพได้โดยไม่กระทบค่าสถานะหรือคะแนน`}
      />
      <p className="text-sm text-ink-soft">เกมจะจำฉากกับชุดที่เลือกไว้ในเครื่องนี้ แยกให้แต่ละบัญชี</p>
      <h2 className="font-display text-xl">ฉากเมนูหลัก</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {menuScenes.map((item) => {
          const open = cosmeticUnlocked(item, progress);
          return (
            <button
              type="button"
              key={item.id}
              disabled={!open}
              aria-pressed={selected.scene === item.id}
              className={`overflow-hidden rounded-2xl border-[3px] text-left disabled:opacity-50 ${selected.scene === item.id ? 'border-grape bg-sun' : 'border-ink bg-paper'}`}
              onClick={() => {
                const next = { ...selected, scene: item.id };
                setSelected(next);
                saveCosmetics(next, user?.uid);
                setSaved(false);
              }}
            >
              <img
                src={sceneUrl(item.scene)}
                alt=""
                className="aspect-[4/3] w-full object-cover object-top"
              />
              <div className="p-2">
                <b>
                  {!open ? '🔒 ' : selected.scene === item.id ? '✓ ' : ''}
                  {item.name}
                </b>
                <p className="text-xs">{open ? 'ปลดล็อกแล้ว' : item.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
      <h2 className="font-display text-xl">สกินตัวละคร</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {skins.map((item) => {
          const character = content.characters.find((c) => c.id === item.characterId);
          const open = cosmeticUnlocked(item, progress);
          const equipped = selected.skins[item.characterId] === item.id;
          return (
            <Panel key={item.id}>
              <div className="flex items-center gap-3">
                <Art
                  id={`skin:${item.id}`}
                  size={100}
                  className={open ? 'shrink-0' : 'shrink-0 grayscale opacity-60'}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold">{item.name}</h3>
                  <p className="text-xs">{character ? lt(character.name) : ''}</p>
                  <p className="my-2 text-xs text-ink-soft">
                    {open ? 'ปลดล็อกแล้ว · ใช้เมื่อเลือกตัวละครนี้' : `🔒 ${item.hint}`}
                  </p>
                  <Button
                    tone={equipped ? 'mint' : 'paper'}
                    disabled={!open}
                    aria-pressed={equipped}
                    onClick={() => {
                      const next = { ...selected, skins: { ...selected.skins } };
                      if (equipped)
                        next.skins = Object.fromEntries(
                          Object.entries(next.skins).filter(([id]) => id !== item.characterId),
                        );
                      else next.skins[item.characterId] = item.id;
                      setSelected(next);
                      saveCosmetics(next, user?.uid);
                      setSaved(false);
                    }}
                  >
                    {equipped ? 'ใช้ชุดเดิม' : 'ใส่ชุดนี้'}
                  </Button>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
      <p role="status" className="text-center text-sm text-ink-soft">
        {saved ? 'เลือกฉากหรือสกินที่ปลดล็อกแล้วได้เลย' : 'เลือกแล้ว · จะใช้กับเมนูและตัวละครของคุณ'}
      </p>
      <Button tone="paper" onClick={onBack}>
        กลับเมนูหลัก
      </Button>
    </main>
  );
}
