import { useRef, useState } from 'react';
import { api, ApiError } from '../net/api';
import { Button } from '../components/ui';
import { PopupButton, PopupClose } from '../components/PopupControls';

const categories = { bug: 'แจ้งบั๊ก', idea: 'เสนอไอเดีย', other: 'อื่น ๆ' };
type Category = keyof typeof categories;

export function Feedback({ connected }: { connected: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [category, setCategory] = useState<Category>('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!connected || sending || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      await api.feedback(category, message.trim());
      setMessage('');
      setCategory('bug');
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429
        ? 'ส่งหลายครั้งติดกัน ลองอีกครั้งใน 10 นาทีนะ'
        : 'ส่งไม่สำเร็จ ข้อความยังอยู่ ลองส่งอีกครั้งได้เลย');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button tone="paper" block onClick={() => {
        setSent(false);
        setError('');
        dialog.current?.showModal();
      }}>
        <span className="flex items-center gap-2"><span aria-hidden="true">💬</span> ส่งฟีดแบ็ก</span>
        <span aria-hidden="true">↗</span>
      </Button>
      <dialog ref={dialog} aria-labelledby="feedback-title" onCancel={e => {
        if (sending) e.preventDefault();
      }} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(92vw,28rem)] overflow-auto rounded-3xl border-2 border-ink bg-[#fff8ea] p-5 text-left text-ink shadow-xl backdrop:bg-black/70">
        <header className="mb-4 flex items-center justify-between gap-4">
          <h2 id="feedback-title" className="text-2xl font-bold">ส่งฟีดแบ็ก</h2>
          {!sending && <PopupClose label="ปิดฟอร์ม" onClick={() => dialog.current?.close()} />}
        </header>
        {sent ? <p role="status">ได้รับฟีดแบ็กแล้ว ขอบคุณที่ช่วยพัฒนาเกมครับ!</p> : (
          <form className="grid gap-4" onSubmit={e => { e.preventDefault(); void submit(); }}>
            <fieldset disabled={sending} className="flex flex-wrap gap-2">
              <legend className="mb-2 font-bold">ประเภทฟีดแบ็ก</legend>
              {(Object.keys(categories) as Category[]).map(key => (
                <label key={key} className="cursor-pointer rounded-full border border-ink px-3 py-2 has-checked:bg-[#e9fb77]">
                  <input type="radio" name="feedback-category" checked={category === key} onChange={() => setCategory(key)} /> {categories[key]}
                </label>
              ))}
            </fieldset>
            <label className="grid gap-1 font-bold">ข้อความ
              <textarea required maxLength={1000} rows={4} disabled={sending} value={message} onChange={e => setMessage(e.target.value)}
                placeholder={category === 'bug' ? 'เจอปัญหาที่หน้าไหน ตอนนั้นกำลังทำอะไรอยู่?' : 'อยากบอกอะไรกับทีมเกม?'}
                className="w-full resize-y rounded-xl border border-ink bg-white p-3 font-normal" />
            </label>
            {!connected && <p role="status">เชื่อมต่อเกมออนไลน์เพื่อส่งฟีดแบ็ก</p>}
            {error && <p role="alert">{error}</p>}
            <PopupButton type="submit" disabled={!connected || sending || !message.trim()}>{sending ? 'กำลังส่ง…' : 'ส่งข้อความ'}</PopupButton>
          </form>
        )}
      </dialog>
    </>
  );
}
