import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0f1117",
  surface: "#181c27",
  card: "#1e2235",
  border: "#2a2f45",
  accent1: "#f97316", // orange - events
  accent2: "#22c55e", // green - chores
  accent3: "#3b82f6", // blue - meals
  accent4: "#a855f7", // purple - school
  text: "#f0f2ff",
  muted: "#6b7280",
};

const SECTIONS = [
  { id: "events", label: "Events", emoji: "📅", color: COLORS.accent1 },
  { id: "chores", label: "Chores", emoji: "✅", color: COLORS.accent2 },
  { id: "meals", label: "Meals", emoji: "🍽️", color: COLORS.accent3 },
  { id: "school", label: "School", emoji: "🎒", color: COLORS.accent4 },
];

const MEMBERS = ["Mom", "Dad", "Kid 1", "Kid 2"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initData = () => {
  try {
    const saved = localStorage.getItem("fam_planner_v1");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    events: [],
    chores: [],
    meals: { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" },
    school: [],
  };
};

let idCounter = Date.now();
const uid = () => (++idCounter).toString(36);

export default function FamilyPlanner() {
  const [active, setActive] = useState("events");
  const [data, setData] = useState(initData);
  const [modal, setModal] = useState(null); // { type, item? }
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("fam_planner_v1", JSON.stringify(data)); } catch {}
  }, [data]);

  const section = SECTIONS.find(s => s.id === active);

  const openAdd = () => {
    setForm({});
    setModal({ type: "add" });
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setModal({ type: "edit", item });
  };

  const closeModal = () => { setModal(null); setForm({}); };

  const save = () => {
    if (active === "meals") return;
    const isEdit = modal?.type === "edit";
    setData(prev => {
      const list = prev[active];
      if (isEdit) {
        return { ...prev, [active]: list.map(i => i.id === form.id ? { ...form } : i) };
      }
      return { ...prev, [active]: [...list, { ...form, id: uid() }] };
    });
    closeModal();
  };

  const del = (id) => {
    setData(prev => ({ ...prev, [active]: prev[active].filter(i => i.id !== id) }));
    setConfirmDelete(null);
  };

  const toggleDone = (id) => {
    setData(prev => ({
      ...prev,
      [active]: prev[active].map(i => i.id === id ? { ...i, done: !i.done } : i)
    }));
  };

  const updateMeal = (day, val) => {
    setData(prev => ({ ...prev, meals: { ...prev.meals, [day]: val } }));
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>Family Planner</div>
          <div style={styles.headerDate}>{today}</div>
        </div>
        <div style={styles.lockBadge}>🔒 Local Only</div>
      </div>

      {/* Nav */}
      <div style={styles.nav}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            style={{ ...styles.navBtn, ...(active === s.id ? { ...styles.navBtnActive, borderColor: s.color, color: s.color } : {}) }}
            onClick={() => setActive(s.id)}
          >
            <span style={styles.navEmoji}>{s.emoji}</span>
            <span style={styles.navLabel}>{s.label}</span>
            {active !== "meals" && s.id !== "meals" && (
              <span style={{ ...styles.navBadge, background: s.color }}>
                {data[s.id]?.filter(i => !i.done).length || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {active === "meals" ? (
          <MealsView meals={data.meals} updateMeal={updateMeal} />
        ) : (
          <ListView
            items={data[active]}
            section={section}
            onEdit={openEdit}
            onToggle={toggleDone}
            onDelete={(id) => setConfirmDelete(id)}
          />
        )}
      </div>

      {/* FAB */}
      {active !== "meals" && (
        <button style={{ ...styles.fab, background: section.color }} onClick={openAdd}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
        </button>
      )}

      {/* Modal */}
      {modal && (
        <ModalOverlay onClose={closeModal}>
          <ItemForm
            active={active}
            section={section}
            form={form}
            setForm={setForm}
            onSave={save}
            onClose={closeModal}
            isEdit={modal.type === "edit"}
          />
        </ModalOverlay>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <ModalOverlay onClose={() => setConfirmDelete(null)}>
          <div style={styles.confirmBox}>
            <div style={styles.confirmTitle}>Delete this item?</div>
            <div style={styles.confirmButtons}>
              <button style={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={{ ...styles.deleteBtn }} onClick={() => del(confirmDelete)}>Delete</button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ListView({ items, section, onEdit, onToggle, onDelete }) {
  if (!items.length) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 48 }}>{section.emoji}</div>
        <div style={styles.emptyText}>Nothing here yet</div>
        <div style={styles.emptyHint}>Tap + to add</div>
      </div>
    );
  }
  const pending = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  return (
    <div style={styles.list}>
      {pending.map(item => (
        <ItemCard key={item.id} item={item} section={section} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
      ))}
      {done.length > 0 && (
        <>
          <div style={styles.doneLabel}>Done ({done.length})</div>
          {done.map(item => (
            <ItemCard key={item.id} item={item} section={section} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </>
      )}
    </div>
  );
}

function ItemCard({ item, section, onEdit, onToggle, onDelete }) {
  return (
    <div style={{ ...styles.card, ...(item.done ? styles.cardDone : {}), borderLeftColor: section.color }}>
      <button style={styles.checkBtn} onClick={() => onToggle(item.id)}>
        <div style={{ ...styles.check, ...(item.done ? { background: section.color, borderColor: section.color } : {}) }}>
          {item.done && <span style={{ color: "#fff", fontSize: 14 }}>✓</span>}
        </div>
      </button>
      <div style={styles.cardBody} onClick={() => onEdit(item)}>
        <div style={{ ...styles.cardTitle, ...(item.done ? styles.strikethrough : {}) }}>{item.title}</div>
        <div style={styles.cardMeta}>
          {item.date && <span style={styles.metaTag}>📅 {item.date}</span>}
          {item.time && <span style={styles.metaTag}>🕐 {item.time}</span>}
          {item.who && <span style={{ ...styles.metaTag, background: section.color + "22", color: section.color }}>👤 {item.who}</span>}
          {item.note && <span style={styles.metaNote}>{item.note}</span>}
        </div>
      </div>
      <button style={styles.delBtn} onClick={() => onDelete(item.id)}>✕</button>
    </div>
  );
}

function MealsView({ meals, updateMeal }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");
  return (
    <div style={styles.mealsGrid}>
      {DAYS.map(day => (
        <div key={day} style={styles.mealCard}>
          <div style={styles.mealDay}>{day}</div>
          {editing === day ? (
            <div style={styles.mealEditRow}>
              <input
                autoFocus
                style={styles.mealInput}
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { updateMeal(day, val); setEditing(null); } }}
                placeholder="What's for dinner?"
              />
              <button style={styles.mealSaveBtn} onClick={() => { updateMeal(day, val); setEditing(null); }}>✓</button>
            </div>
          ) : (
            <div style={styles.mealValue} onClick={() => { setEditing(day); setVal(meals[day] || ""); }}>
              {meals[day] || <span style={{ color: COLORS.muted, fontSize: 13 }}>Tap to add</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ItemForm({ active, section, form, setForm, onSave, onClose, isEdit }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isReady = form.title?.trim();
  return (
    <div style={styles.formBox}>
      <div style={{ ...styles.formTitle, color: section.color }}>
        {section.emoji} {isEdit ? "Edit" : "Add"} {section.label.slice(0, -1)}
      </div>
      <input style={styles.input} placeholder="Title *" value={form.title || ""} onChange={e => set("title", e.target.value)} />
      <div style={styles.formRow}>
        <input style={styles.inputHalf} type="date" value={form.date || ""} onChange={e => set("date", e.target.value)} />
        {active !== "chores" && (
          <input style={styles.inputHalf} type="time" value={form.time || ""} onChange={e => set("time", e.target.value)} />
        )}
      </div>
      <div style={styles.whoRow}>
        {MEMBERS.map(m => (
          <button
            key={m}
            style={{ ...styles.whoChip, ...(form.who === m ? { background: section.color, color: "#fff", borderColor: section.color } : {}) }}
            onClick={() => set("who", form.who === m ? "" : m)}
          >
            {m}
          </button>
        ))}
      </div>
      <textarea style={styles.textarea} placeholder="Note (optional)" value={form.note || ""} onChange={e => set("note", e.target.value)} rows={2} />
      <div style={styles.formButtons}>
        <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
        <button style={{ ...styles.saveBtn, background: isReady ? section.color : COLORS.border, cursor: isReady ? "pointer" : "default" }} onClick={isReady ? onSave : undefined}>
          {isEdit ? "Update" : "Add"}
        </button>
      </div>
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'DM Sans', 'Nunito', sans-serif",
    display: "flex",
    flexDirection: "column",
    maxWidth: 680,
    margin: "0 auto",
    position: "relative",
    paddingBottom: 100,
  },
  header: {
    padding: "20px 20px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  headerTitle: { fontSize: 26, fontWeight: 700, letterSpacing: -0.5 },
  headerDate: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  lockBadge: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 12,
    color: COLORS.muted,
  },
  nav: {
    display: "flex",
    padding: "12px 12px 0",
    gap: 8,
    overflowX: "auto",
  },
  navBtn: {
    flex: "1 1 0",
    minWidth: 72,
    background: COLORS.surface,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: "10px 6px",
    color: COLORS.muted,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    position: "relative",
    transition: "all 0.15s",
  },
  navBtnActive: {
    background: COLORS.card,
    fontWeight: 700,
  },
  navEmoji: { fontSize: 20 },
  navLabel: { fontSize: 12, fontWeight: 600 },
  navBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 99,
    minWidth: 18,
    height: 18,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
    padding: "0 4px",
  },
  content: { flex: 1, padding: "16px 12px 0" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: COLORS.card,
    borderRadius: 14,
    borderLeft: "4px solid transparent",
    display: "flex",
    alignItems: "center",
    padding: "12px 10px",
    gap: 10,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  cardDone: { opacity: 0.5 },
  checkBtn: { background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 7,
    border: `2px solid ${COLORS.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  strikethrough: { textDecoration: "line-through" },
  cardMeta: { display: "flex", flexWrap: "wrap", gap: 6 },
  metaTag: {
    fontSize: 12,
    background: COLORS.surface,
    borderRadius: 6,
    padding: "2px 7px",
    color: COLORS.muted,
  },
  metaNote: { fontSize: 12, color: COLORS.muted, width: "100%", marginTop: 2 },
  delBtn: {
    background: "none",
    border: "none",
    color: COLORS.muted,
    cursor: "pointer",
    fontSize: 16,
    padding: "4px 8px",
    borderRadius: 8,
    flexShrink: 0,
  },
  doneLabel: { fontSize: 12, color: COLORS.muted, fontWeight: 600, marginTop: 8, marginBottom: 4, paddingLeft: 4 },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyText: { fontSize: 18, fontWeight: 600, color: COLORS.muted },
  emptyHint: { fontSize: 14, color: COLORS.border },
  mealsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  mealCard: {
    background: COLORS.card,
    borderRadius: 14,
    padding: "14px 14px 12px",
    borderLeft: `4px solid ${COLORS.accent3}`,
  },
  mealDay: { fontSize: 13, fontWeight: 700, color: COLORS.accent3, marginBottom: 6 },
  mealValue: { fontSize: 15, fontWeight: 500, minHeight: 28, cursor: "pointer" },
  mealEditRow: { display: "flex", gap: 6 },
  mealInput: {
    flex: 1,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.text,
    fontSize: 14,
    padding: "6px 8px",
    outline: "none",
  },
  mealSaveBtn: {
    background: COLORS.accent3,
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    padding: "4px 10px",
    cursor: "pointer",
  },
  fab: {
    position: "fixed",
    bottom: 28,
    right: "calc(50% - 330px + 20px)",
    width: 60,
    height: 60,
    borderRadius: "50%",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    fontSize: 28,
    zIndex: 10,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  },
  formBox: {
    background: COLORS.card,
    borderRadius: "20px 20px 0 0",
    padding: "24px 20px 36px",
    width: "100%",
    maxWidth: 680,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  formTitle: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  input: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 16,
    padding: "12px 14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  formRow: { display: "flex", gap: 10 },
  inputHalf: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 15,
    padding: "12px 10px",
    outline: "none",
    flex: 1,
    colorScheme: "dark",
  },
  whoRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  whoChip: {
    background: COLORS.surface,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 20,
    padding: "8px 14px",
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  textarea: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 15,
    padding: "12px 14px",
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  formButtons: { display: "flex", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: 600,
    padding: "14px",
    cursor: "pointer",
  },
  saveBtn: {
    flex: 2,
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    padding: "14px",
    transition: "background 0.15s",
  },
  confirmBox: {
    background: COLORS.card,
    borderRadius: "20px 20px 0 0",
    padding: "28px 20px 40px",
    width: "100%",
    maxWidth: 680,
  },
  confirmTitle: { fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 24 },
  confirmButtons: { display: "flex", gap: 10 },
  deleteBtn: {
    flex: 2,
    background: "#ef4444",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    padding: "14px",
    cursor: "pointer",
  },
};
