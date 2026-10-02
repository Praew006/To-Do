import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ListChecks, Search, CalendarDays, X } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-400", active: "bg-emerald-500 text-white" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-400", active: "bg-amber-500 text-white" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500", active: "bg-rose-500 text-white" },
};
const ORDER = ["low", "medium", "high"];

const CATEGORIES = {
  work: { label: "งาน", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700 ring-sky-200" },
  personal: { label: "ส่วนตัว", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 ring-violet-200" },
  shopping: { label: "ช้อปปิ้ง", dot: "bg-pink-500", chip: "bg-pink-50 text-pink-700 ring-pink-200" },
  health: { label: "สุขภาพ", dot: "bg-teal-500", chip: "bg-teal-50 text-teal-700 ring-teal-200" },
};
const CAT_ORDER = ["work", "personal", "shopping", "health"];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

/* ---------- date helpers (local time, YYYY-MM-DD) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => toKey(new Date());
const offsetKey = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toKey(d);
};
const fmtDate = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};
const isOverdue = (t, today) => !!t.due && !t.done && t.due < today;

function DueBadge({ todo, today, onChange }) {
  const { due, done } = todo;
  let cls = "bg-slate-50 text-slate-500 ring-slate-200";
  let label = "กำหนดวัน";
  if (due) {
    label = fmtDate(due);
    if (!done && due < today) {
      cls = "bg-rose-50 text-rose-700 ring-rose-200";
      label = `เลยกำหนด ${fmtDate(due)}`;
    } else if (!done && due === today) {
      cls = "bg-yellow-100 text-yellow-800 ring-yellow-300";
      label = "วันนี้";
    }
  }
  return (
    <span className={`relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      <CalendarDays size={12} />
      {label}
      <input
        type="date"
        value={due || ""}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        aria-label="เลือกวันครบกำหนด"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}

function TodoItem({ todo, today, onToggle, onDelete, onEdit, onCyclePriority, onCycleCategory, onSetDue }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const p = PRIORITIES[todo.priority];
  const c = CATEGORIES[todo.category];

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
        maxHeight: todo.removing ? 0 : 200,
        opacity: todo.removing ? 0 : 1,
        transform: todo.removing ? "translateX(24px)" : "translateX(0)",
        marginBottom: todo.removing ? 0 : 12,
        transition: "max-height 300ms ease, opacity 250ms ease, transform 300ms ease, margin 300ms ease",
      }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-3 overflow-hidden rounded-xl bg-white py-3 pl-0 pr-3 shadow-sm ring-1 ring-slate-100">
        <span className={`w-1 self-stretch rounded-r ${p.bar}`} aria-hidden="true" />

        <button
          type="button"
          role="checkbox"
          aria-checked={todo.done}
          aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
          onClick={() => onToggle(todo.id)}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
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
              className={`block cursor-text select-none break-words text-base transition-colors ${
                todo.done ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {todo.text}
            </span>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCycleCategory(todo.id)}
              title="แตะเพื่อเปลี่ยนหมวดหมู่"
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${c.chip}`}
            >
              {c.label}
            </button>
            <DueBadge todo={todo} today={today} onChange={(v) => onSetDue(todo.id, v)} />
          </div>
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

function StatsCard({ total, done, active, overdue }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const segs = [
    { n: done, color: "#10b981", label: "เสร็จแล้ว" },
    { n: active, color: "#6366f1", label: "ยังไม่เสร็จ" },
    { n: overdue, color: "#f43f5e", label: "เลยกำหนด" },
  ];
  let acc = 0;
  return (
    <section className="mb-5 flex items-center gap-5 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`เสร็จแล้ว ${pct} เปอร์เซ็นต์`}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          {total > 0 &&
            segs.map((s) => {
              if (!s.n) return null;
              const len = (s.n / total) * C;
              const el = (
                <circle key={s.label} cx="50" cy="50" r={R} fill="none" stroke={s.color} strokeWidth="12" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />
              );
              acc += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{pct}%</span>
          <span className="text-[11px] text-slate-500">เสร็จแล้ว</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">งานทั้งหมด</p>
        <p className="mb-2 text-2xl font-bold text-slate-900">{total}</p>
        <ul className="space-y-1 text-sm text-slate-600">
          {segs.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span className="flex-1">{s.label}</span>
              <span className="font-semibold text-slate-800">{s.n}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function TodoApp() {
  const today = todayKey();
  const [todos, setTodos] = useState(() => [
    { id: 1, text: "ส่งรายงานความคืบหน้าประจำสัปดาห์", done: false, priority: "high", category: "work", due: offsetKey(-1), removing: false },
    { id: 2, text: "ตอบอีเมลที่ค้างอยู่", done: false, priority: "medium", category: "work", due: offsetKey(0), removing: false },
    { id: 3, text: "ซื้อของเข้าบ้าน", done: false, priority: "low", category: "shopping", due: offsetKey(2), removing: false },
    { id: 4, text: "วิ่งสวนสาธารณะ 30 นาที", done: true, priority: "low", category: "health", due: "", removing: false },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("work");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const nextId = useRef(5);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [{ id: nextId.current++, text: t, done: false, priority, category, due, removing: false }, ...prev]);
    setText("");
    setDue("");
  };

  const update = (id, patch) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];

  const toggle = (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeWithAnimation = (ids) => {
    setTodos((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((prev) => prev.filter((t) => !ids.includes(t.id))), 320);
  };

  const live = todos.filter((t) => !t.removing);
  const doneCount = live.filter((t) => t.done).length;
  const overdueCount = live.filter((t) => isOverdue(t, today)).length;
  const activeCount = live.length - doneCount - overdueCount;
  const remaining = live.filter((t) => !t.done).length;
  const completedIds = live.filter((t) => t.done).map((t) => t.id);
  const catCount = (k) => live.filter((t) => t.category === k).length;

  const q = query.trim().toLowerCase();
  const visible = todos.filter((t) => {
    if (filter === "active" && t.done) return false;
    if (filter === "completed" && !t.done) return false;
    if (catFilter !== "all" && t.category !== catFilter) return false;
    if (q && !t.text.toLowerCase().includes(q)) return false;
    return true;
  });

  const emptyText = q
    ? "ไม่พบงานที่ตรงกับคำค้นหา"
    : filter === "completed"
    ? "ยังไม่มีงานที่เสร็จ"
    : filter === "active"
    ? "ไม่มีงานค้างแล้ว เยี่ยมเลย!"
    : "ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย";

  const sideBtn = (active) =>
    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12" style={{ fontFamily: "'Noto Sans Thai', 'Sarabun', system-ui, sans-serif" }}>
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <ListChecks size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จดงาน จัดลำดับ แล้วทำให้เสร็จทีละอย่าง</p>
          </div>
        </header>

        <StatsCard total={live.length} done={doneCount} active={activeCount} overdue={overdueCount} />

        <div className="grid gap-5 md:grid-cols-[200px_1fr]">
          {/* Category sidebar */}
          <aside className="md:sticky md:top-6 md:self-start">
            <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100 md:flex-col md:overflow-visible" aria-label="หมวดหมู่">
              <button type="button" onClick={() => setCatFilter("all")} className={sideBtn(catFilter === "all")}>
                <span className="flex-1 text-left">ทุกหมวดหมู่</span>
                <span className={`text-xs ${catFilter === "all" ? "text-indigo-100" : "text-slate-400"}`}>{live.length}</span>
              </button>
              {CAT_ORDER.map((k) => (
                <button key={k} type="button" onClick={() => setCatFilter(k)} className={sideBtn(catFilter === k)}>
                  <span className={`h-2.5 w-2.5 rounded-full ${CATEGORIES[k].dot}`} />
                  <span className="flex-1 whitespace-nowrap text-left">{CATEGORIES[k].label}</span>
                  <span className={`text-xs ${catFilter === k ? "text-indigo-100" : "text-slate-400"}`}>{catCount(k)}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="min-w-0">
            {/* Add card */}
            <section className="mb-4 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-100">
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

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span>ความสำคัญ</span>
                  <div className="flex rounded-lg bg-slate-100 p-0.5" role="radiogroup" aria-label="ระดับความสำคัญ">
                    {ORDER.map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={priority === k}
                        onClick={() => setPriority(k)}
                        className={`rounded-md px-3 py-1 font-medium transition-colors ${
                          priority === k ? PRIORITIES[k].active + " shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {PRIORITIES[k].label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <span>หมวดหมู่</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 outline-none focus:border-indigo-400"
                  >
                    {CAT_ORDER.map((k) => (
                      <option key={k} value={k}>
                        {CATEGORIES[k].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span>ครบกำหนด</span>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 outline-none focus:border-indigo-400"
                  />
                </label>
              </div>
            </section>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                aria-label="ค้นหางาน"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-base text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="ล้างคำค้นหา" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              )}
            </div>

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
                  <TodoItem
                    key={t.id}
                    todo={t}
                    today={today}
                    onToggle={toggle}
                    onDelete={(id) => removeWithAnimation([id])}
                    onEdit={(id, v) => update(id, { text: v })}
                    onCyclePriority={(id) => update(id, { priority: cycle(ORDER, t.id === id ? t.priority : "") })}
                    onCycleCategory={(id) => update(id, { category: cycle(CAT_ORDER, t.id === id ? t.category : "") })}
                    onSetDue={(id, v) => update(id, { due: v })}
                  />
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

            <p className="mt-6 text-center text-xs text-slate-400">ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · แตะป้ายความสำคัญ/หมวดหมู่เพื่อสลับ · แตะป้ายวันที่เพื่อเปลี่ยนวัน</p>
          </main>
        </div>
      </div>
    </div>
  );
}
