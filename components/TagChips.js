
export default function TagChips({ tags }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="row" style={{ gap: 8, marginTop: 8 }}>
      {tags.map((t) => (
        <span
          key={t.code}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            border: "1px solid rgba(0,0,0,.06)",
            background: t.color || "#eee",
            color: "#111",
          }}
          title={t.label}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}
