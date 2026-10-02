import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ListChecks } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-400", active: "bg-emerald-500 text-white" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-400", active: "bg-amber-500 text-white" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500", active: "bg-rose-500 text-white" },
};
const ORDER = ["low", "medium", "high"];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

function TodoItem({ todo, onToggle, onDelete, onEdit, onCyclePriority }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const p = PRIORITIES[todo.priority];

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = () => {
    const t = draft.trim();
    if (t) onEdit(todo.id, t);
    else setDraft(todo.text);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(todo.text);
    setEditing(false);
  };

  return (
    <li
      style={{
        maxHeight: todo.removing ? 0 : 160,
        opacity: todo.removing ? 0 : 1,
        transform: todo.removing ? "translateX(24px)" : "translateX(0)",
        marginBottom: todo.removing ? 0 : 12,
        transition: "max-height 300ms ease, opacity 250ms ease, transform 300ms ease, margin 300ms ease",
      }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-3 rounded-xl bg-white pl-0 pr-3 py-3 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <span className={`self-stretch w-1 rounded-r ${p.bar}`} aria-hidden="true" />

        <button
          type="button"
          role="checkbox"
          aria-checked={todo.done}
          aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
          onClick={() => onToggle(todo.id)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            todo.done ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white hover:border-indigo-400"
          }`}
        >
          {todo.done && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
              }}
              className="w-full rounded-md border border-indigo-300 bg-white px-2 py-1 text-base text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          ) : (
            <span
              onDoubleClick={() => setEditing(true)}
              title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`block cursor-text break-words select-none text-base transition-colors ${
                todo.done ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {todo.text}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onCyclePriority(todo.id)}
          title="แตะเพื่อเปลี่ยนระดับความสำคัญ"
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${p.badge}`}
        >
          {p.label}
        </button>

        <button
          type="button"
          onClick={() => onDelete(todo.id)}
          aria-label="ลบงาน"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานความคืบหน้าประจำสัปดาห์", done: false, priority: "high", removing: false },
    { id: 2, text: "ตอบอีเมลที่ค้างอยู่", done: false, priority: "medium", removing: false },
    { id: 3, text: "จัดระเบียบโฟลเดอร์งาน", done: true, priority: "low", removing: false },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const nextId = useRef(4);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [{ id: nextId.current++, text: t, done: false, priority, removing: false }, ...prev]);
    setText("");
  };

  const toggle = (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const edit = (id, newText) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: newText } : t)));
  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % ORDER.length] } : t))
    );

  const removeWithAnimation = (ids) => {
    setTodos((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((prev) => prev.filter((t) => !ids.includes(t.id))), 320);
  };

  const remaining = todos.filter((t) => !t.done && !t.removing).length;
  const completedIds = todos.filter((t) => t.done && !t.removing).map((t) => t.id);

  const visible = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "completed") return t.done;
    return true;
  });

  const emptyText =
    filter === "completed" ? "ยังไม่มีงานที่เสร็จ" : filter === "active" ? "ไม่มีงานค้างแล้ว เยี่ยมเลย!" : "ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12" style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', system-ui, sans-serif" }}>

      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <ListChecks size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จดงาน จัดลำดับ แล้วทำให้เสร็จทีละอย่าง</p>
          </div>
        </header>

        {/* Add card */}
        <section className="mb-5 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="เพิ่มงานใหม่..."
              aria-label="เพิ่มงานใหม่"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={add}
              disabled={!text.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">เพิ่มงาน</span>
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">ความสำคัญ</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5" role="radiogroup" aria-label="ระดับความสำคัญ">
              {ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={priority === k}
                  onClick={() => setPriority(k)}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    priority === k ? PRIORITIES[k].active + " shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {PRIORITIES[k].label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Filter tabs */}
        <div className="mb-4 flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                filter === f.key ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-100">{emptyText}</div>
        ) : (
          <ul>
            {visible.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={toggle} onDelete={(id) => removeWithAnimation([id])} onEdit={edit} onCyclePriority={cyclePriority} />
            ))}
          </ul>
        )}

        {/* Footer */}
        <footer className="mt-4 flex items-center justify-between gap-3 px-1 text-sm">
          <span className="text-slate-600">เหลือ {remaining} งานที่ต้องทำ</span>
          <button
            type="button"
            onClick={() => removeWithAnimation(completedIds)}
            disabled={completedIds.length === 0}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            ล้างงานที่เสร็จแล้ว{completedIds.length > 0 ? ` (${completedIds.length})` : ""}
          </button>
        </footer>

        <p className="mt-6 text-center text-xs text-slate-400">ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · แตะป้ายความสำคัญเพื่อสลับระดับ</p>
      </div>
    </div>
  );
}
