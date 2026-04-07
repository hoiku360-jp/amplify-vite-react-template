// src/features/plan/PracticePicker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  open: boolean;
  selectedPracticeCode?: string;
  onClose: () => void;
  onSelect: (practiceCode: string) => void;
};

function s(v: unknown): string {
  return String(v ?? "").trim();
}

function previewText(v: unknown, max = 80): string {
  const text = s(v).replace(/\s+/g, " ");
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max) + "…";
}

export default function PracticePicker(props: Props) {
  const { open, selectedPracticeCode, onClose, onSelect } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [rows, setRows] = useState<Array<Schema["PracticeCode"]["type"]>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data, errors } = await client.models.PracticeCode.list({
          authMode: "userPool",
          limit: 10000,
        });

        if (errors?.length) {
          throw new Error(errors.map((e) => e.message).join("\n"));
        }

        const list = (data ?? [])
          .filter((x) => s((x as any).practice_code).startsWith("PR-"))
          .sort((a, b) => {
            const ra = s((a as any).recordedAt);
            const rb = s((b as any).recordedAt);
            return rb.localeCompare(ra);
          });

        setRows(list);
        setPage(0);
      } catch (e: any) {
        setError(e?.message ?? "Practice一覧の取得に失敗しました。");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [client, open]);

  const filteredRows = useMemo(() => {
    const q = s(query).toLowerCase();
    const st = s(statusFilter).toUpperCase();

    return rows.filter((r) => {
      const practiceCode = s((r as any).practice_code);
      const name = s((r as any).name);
      const memo = s((r as any).memo);
      const transcriptText = s((r as any).transcriptText);
      const status = s((r as any).status).toUpperCase();

      const hitQuery =
        !q ||
        practiceCode.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        memo.toLowerCase().includes(q) ||
        transcriptText.toLowerCase().includes(q);

      const hitStatus = !st || status === st;
      return hitQuery && hitStatus;
    });
  }, [rows, query, statusFilter]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(page, 0), totalPages - 1);

  const pageRows = useMemo(() => {
    const start = clampedPage * pageSize;
    const end = start + pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, clampedPage, pageSize]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(1100px, 96vw)",
          maxHeight: "90vh",
          overflow: "hidden",
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #ddd",
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>PLAN 用 Practice 選択</div>
            <div style={{ fontWeight: 700 }}>Practice を1件選択</div>
          </div>
          <button onClick={onClose}>閉じる</button>
        </div>

        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #eee",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            検索
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="practice_code / name / memo"
              style={{ minWidth: 320 }}
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            status
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">すべて</option>
              <option value="UPLOADING">UPLOADING</option>
              <option value="TRANSCRIBING">TRANSCRIBING</option>
              <option value="AI_ANALYZING">AI_ANALYZING</option>
              <option value="REVIEW">REVIEW</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ERROR">ERROR</option>
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            1ページ表示
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value={5}>5件</option>
              <option value={10}>10件</option>
              <option value={20}>20件</option>
            </select>
          </label>
        </div>

        <div style={{ overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: 16 }}>読み込み中...</div>
          ) : error ? (
            <div style={{ padding: 16, color: "crimson", whiteSpace: "pre-wrap" }}>
              Error: {error}
            </div>
          ) : totalRows === 0 ? (
            <div style={{ padding: 16 }}>選択できる Practice がありません。</div>
          ) : (
            <table
              style={{
                width: "100%",
                minWidth: 980,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    practice_code / name
                  </th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    status
                  </th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    category
                  </th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    memo
                  </th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const practiceCode = s((r as any).practice_code);
                  const name = s((r as any).name);
                  const status = s((r as any).status);
                  const category = s((r as any).category_name);
                  const memo = previewText((r as any).memo, 100);
                  const selected = practiceCode === s(selectedPracticeCode);

                  return (
                    <tr key={r.id}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ fontWeight: 600 }}>{name || "(no name)"}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{practiceCode}</div>
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                        {status || "-"}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                        {category || "-"}
                      </td>
                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #f0f0f0",
                          fontSize: 12,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {memo || "-"}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                        <button
                          onClick={() => onSelect(practiceCode)}
                          disabled={!practiceCode || selected}
                        >
                          {selected ? "選択中" : "この Practice を使う"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            padding: 12,
            borderTop: "1px solid #eee",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button onClick={() => setPage(0)} disabled={clampedPage === 0}>
            ⏮ 最初
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
          >
            ◀ 前へ
          </button>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {clampedPage + 1} / {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={clampedPage >= totalPages - 1}
          >
            次へ ▶
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={clampedPage >= totalPages - 1}
          >
            最後 ⏭
          </button>
        </div>
      </div>
    </div>
  );
}