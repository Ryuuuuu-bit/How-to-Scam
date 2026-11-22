import { sceneUrl } from '../assets/art';

/**
 * ฉากพื้นหลังเต็มจอ (ภาพจาก GPT) ไล่เฉดลงไปเป็นสีครีมด้านล่างให้การ์ดอ่านง่าย
 * ถ้ายังไม่มีภาพของฉากนี้ จะใช้พื้นสีครีมลายจุดแทน
 */
export function SceneBackdrop({ id }: { id: string }) {
  const url = sceneUrl(id);
  return (
    <div
      aria-hidden
      className="scene-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {url ? (
        <img
          key={url}
          src={url}
          alt=""
          className="scene-image anim-scene-in absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(#2b214018_1.5px,transparent_1.5px)] [background-size:18px_18px]" />
      )}
      <div className="scene-shade absolute inset-0" />
    </div>
  );
}
