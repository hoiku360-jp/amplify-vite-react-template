import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type DigestRow = Schema["DailyDigest"]["type"];

type DigestJson = {
  date?: string;
  tenantId?: string;
  owner?: string;
  ownerKey?: string;
  top5?: string[];
  todos?: string[];
  insights?: string[];
  sources?: { count?: number };
  note?: string;
  raw?: string;
  [k: string]: any;
};

function safeParseJson(
  text: string | null | undefined,
): { ok: true; json: DigestJson } | { ok: false; error: string } {
  if (!text || text.trim().length === 0) {
    return { ok: false, error: "body が空です" };
  }
  try {
    const json = JSON.parse(text);
    return { ok: true, json };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "JSON.parse に失敗しました" };
  }
}

function ymddate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function digestKey(d: DigestRow | null | undefined) {
  if (!d) return "";
  return `${d.tenantId ?? ""}#${(d as any).ownerKey ?? ""}#${d.digestDate ?? ""}`;
}

export default function DailyDigestPanel(props: {
  tenantId: string;
  owner: string;
}) {
  const { tenantId, owner } = props;

  const ownerKey = owner;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [digests, setDigests] = useState<DigestRow[]>([]);
  const [selected, setSelected] = useState<DigestRow | null>(null);
  const [parsed, setParsed] = useState<
    { ok: true; json: DigestJson } | { ok: false; error: string } | null
  >(null);
  const [showRaw, setShowRaw] = useState(false);
  const [sourceMode, setSourceMode] = useState<string>("");

  async function refresh() {
    setLoading(true);
    setErr(null);

    try {
      let items: DigestRow[] = [];
      const anyClient: any = client as any;

      const qfOnModel =
        typeof anyClient.models?.DailyDigest?.listDigestsByTenantOwnerDate ===
        "function";

      const qfOnQueries =
        typeof anyClient.queries?.listDigestsByTenantOwnerDate === "function";

      if (qfOnModel) {
        setSourceMode("queryField(models.DailyDigest)");
        const res = await anyClient.models.DailyDigest.listDigestsByTenantOwnerDate(
          {
            tenantId,
            ownerKey,
            sortDirection: "DESC",
            limit: 60,
          },
        );

        if (res?.errors?.length) {
          throw new Error(res.errors.map((e: any) => e.message).join("\n"));
        }

        items = (res?.data ?? []) as DigestRow[];
      } else if (qfOnQueries) {
        setSourceMode("queryField(queries)");
        const res = await anyClient.queries.listDigestsByTenantOwnerDate({
          tenantId,
          ownerKey,
          sortDirection: "DESC",
          limit: 60,
        });

        if (res?.errors?.length) {
          throw new Error(res.errors.map((e: any) => e.message).join("\n"));
        }

        items = (res?.data ?? []) as DigestRow[];
      } else {
        setSourceMode("model.list fallback");
        const res = await client.models.DailyDigest.list({
          filter: {
            tenantId: { eq: tenantId },
            ownerKey: { eq: ownerKey },
          },
          limit: 60,
        });

        if (res.errors?.length) {
          throw new Error(res.errors.map((e) => e.message).join("\n"));
        }

        items = (res.data ?? []) as DigestRow[];
        items.sort((a, b) =>
          (b.digestDate ?? "").localeCompare(a.digestDate ?? ""),
        );
      }

      setDigests(items);

      if (items.length === 0) {
        setSelected(null);
        return;
      }

      const currentKey = digestKey(selected);
      if (!currentKey) {
        setSelected(items[0]);
        return;
      }

      const found = items.find((x) => digestKey(x) === currentKey);
      setSelected(found ?? items[0]);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? String(e));
      setDigests([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!tenantId || !ownerKey) {
      setErr("tenantId または ownerKey が空です");
      setDigests([]);
      setSelected(null);
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, ownerKey]);

  useEffect(() => {
    if (!selected) {
      setParsed(null);
      return;
    }
    setParsed(safeParseJson(selected.body));
  }, [selected]);

  const today = ymddate(new Date());
  const yesterday = ymddate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const headerStyle: React.CSSProperties = { fontWeight: 700, marginBottom: 8 };
  const cardStyle: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 12,
    background: "#fff",
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 700 }}>Daily Digest</div>

        <div style={{ color: "#666" }}>
          tenant: <code>{tenantId}</code>
        </div>

        <div style={{ color: "#666" }}>
          owner: <code>{owner}</code>
        </div>

        <div style={{ color: "#666" }}>
          mode: <code>{sourceMode || "-"}</code>
        </div>

        <button onClick={refresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>

        <button
          onClick={() => {
            const found = digests.find((d) => d.digestDate === today);
            if (found) {
              setErr(null);
              setSelected(found);
            } else {
              setErr(`今日(${today})のDigestが見つかりませんでした`);
            }
          }}
          disabled={loading}
        >
          今日
        </button>

        <button
          onClick={() => {
            const found = digests.find((d) => d.digestDate === yesterday);
            if (found) {
              setErr(null);
              setSelected(found);
            } else {
              setErr(`昨日(${yesterday})のDigestが見つかりませんでした`);
            }
          }}
          disabled={loading}
        >
          昨日
        </button>

        <label
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            checked={showRaw}
            onChange={(e) => setShowRaw(e.target.checked)}
          />
          raw JSON も表示
        </label>
      </div>

      {err && (
        <div
          style={{
            ...cardStyle,
            borderColor: "#f3c2c2",
            background: "#fff7f7",
            color: "#a33",
          }}
        >
          <div style={headerStyle}>Error</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{err}</pre>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 12,
          alignItems: "start",
        }}
      >
        <div style={cardStyle}>
          <div style={headerStyle}>一覧（最新順）</div>

          {digests.length === 0 ? (
            <div style={{ color: "#666" }}>
              まだ DailyDigest がありません。Scheduler が動くか、手動で
              daily-digest を実行して作成してください。
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {digests.map((d) => {
                const isSel = digestKey(selected) === digestKey(d);

                return (
                  <button
                    key={digestKey(d)}
                    onClick={() => setSelected(d)}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      background: isSel ? "#eef6ff" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{d.digestDate}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      sources: {d.sourceCount ?? 0} / status: {d.status ?? "-"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {selected?.title ?? "（未選択）"}
              </div>

              {selected?.digestDate && (
                <div style={{ color: "#666" }}>
                  date: <code>{selected.digestDate}</code>
                </div>
              )}
            </div>

            {!selected ? (
              <div style={{ marginTop: 10, color: "#666" }}>
                左の一覧から日付を選んでください。
              </div>
            ) : parsed?.ok ? (
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {(parsed.json.owner || parsed.json.ownerKey) && (
                  <div style={{ color: "#666", fontSize: 12 }}>
                    json.owner: <b>{parsed.json.owner ?? "-"}</b> / json.ownerKey:{" "}
                    <b>{parsed.json.ownerKey ?? "-"}</b>
                  </div>
                )}

                {parsed.json.note && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: "#fffbe6",
                      border: "1px solid #f0e6a0",
                    }}
                  >
                    <b>Note:</b> {parsed.json.note}
                  </div>
                )}

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 700 }}>今日の重要点 TOP5</div>
                  {(parsed.json.top5 ?? []).length === 0 ? (
                    <div style={{ color: "#666" }}>（なし）</div>
                  ) : (
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                      {(parsed.json.top5 ?? []).slice(0, 5).map((x, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                          {x}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 700 }}>未完了 TODO</div>
                  {(parsed.json.todos ?? []).length === 0 ? (
                    <div style={{ color: "#666" }}>（なし）</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(parsed.json.todos ?? []).slice(0, 10).map((x, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                          {x}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 700 }}>気づき / 学び</div>
                  {(parsed.json.insights ?? []).length === 0 ? (
                    <div style={{ color: "#666" }}>（なし）</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(parsed.json.insights ?? []).slice(0, 10).map((x, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                          {x}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={{ color: "#666", fontSize: 12 }}>
                  sources.count: <b>{parsed.json.sources?.count ?? 0}</b>
                </div>

                {showRaw && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      raw JSON
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        background: "#f7f7f7",
                        padding: 10,
                        borderRadius: 8,
                      }}
                    >
                      {JSON.stringify(parsed.json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 10, color: "#a33" }}>
                <div style={{ fontWeight: 700 }}>JSON parse error</div>
                <div>{parsed?.error ?? "unknown error"}</div>
                {showRaw && (
                  <pre
                    style={{
                      marginTop: 8,
                      whiteSpace: "pre-wrap",
                      background: "#f7f7f7",
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    {selected.body ?? ""}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}