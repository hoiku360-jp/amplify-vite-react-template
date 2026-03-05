// src/features/practice/PracticeSearchPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type SortKey = "scoreSum" | "scoreMax" | "linkCount";

type PracticeLite = {
  practice_code: string;
  category_name?: string | null;
  name?: string | null;
  memo?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  status?: string | null;
};

type PracticeMap = Record<string, PracticeLite>;

function s(v: unknown): string {
  return String(v ?? "").trim();
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function PracticeSearchPanel() {
  const client = useMemo(() => generateClient<Schema>(), []);

  const [abilityRawCount, setAbilityRawCount] = useState(0);
  const [abilityOptions, setAbilityOptions] = useState<Array<Schema["AbilityCode"]["type"]>>([]);
  const [selectedAbility, setSelectedAbility] = useState<string>("");

  const [sortKey, setSortKey] = useState<SortKey>("scoreSum");
  const [rows, setRows] = useState<Array<Schema["AbilityPracticeAgg"]["type"]>>([]);

  const [practiceByCode, setPracticeByCode] = useState<PracticeMap>({});
  const [practiceHitCount, setPracticeHitCount] = useState(0);

  const [loadingAbility, setLoadingAbility] = useState(false);
  const [loadingAgg, setLoadingAgg] = useState(false);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [error, setError] = useState<string>("");

  // Refresh用
  const [practiceReloadKey, setPracticeReloadKey] = useState(0);

  // ★ ページング
  const [pageSize, setPageSize] = useState<number>(5); // 4〜5件が希望なら 5 推奨
  const [page, setPage] = useState<number>(0); // 0-based

  // ----------------------------
  // 1) AbilityCode（大/中）ロード
  // ----------------------------
  useEffect(() => {
    (async () => {
      setLoadingAbility(true);
      setError("");
      try {
        const { data, errors } = await client.models.AbilityCode.list(
          { limit: 10000 },
          { authMode: "userPool" }
        );
        if (errors?.length) throw errors;

        const raw = data ?? [];
        setAbilityRawCount(raw.length);

        const filtered = raw.filter((x) => {
          const status = s((x as any).status || "active").toLowerCase();
          const level = Number((x as any).level ?? 0);
          return (level === 1 || level === 2) && status === "active";
        });

        const items = [...filtered].sort((a, b) => {
          const sa = Number((a as any).sort_order ?? 999999);
          const sb = Number((b as any).sort_order ?? 999999);
          if (sa !== sb) return sa - sb;
          return s((a as any).code).localeCompare(s((b as any).code));
        });

        setAbilityOptions(items);

        const first = items.find((i) => Number((i as any).level) === 2) ?? items[0];
        if (first?.code) setSelectedAbility(String(first.code));
      } catch (e: any) {
        setError(e?.message ?? JSON.stringify(e, null, 2));
        setAbilityRawCount(0);
        setAbilityOptions([]);
        setSelectedAbility("");
      } finally {
        setLoadingAbility(false);
      }
    })();
  }, [client]);

  // ----------------------------
  // 2) Agg検索
  // ----------------------------
  useEffect(() => {
    if (!selectedAbility) {
      setRows([]);
      return;
    }

    (async () => {
      setLoadingAgg(true);
      setError("");
      try {
        const { data, errors } = await client.models.AbilityPracticeAgg.list(
          {
            filter: { abilityCode: { eq: selectedAbility } },
            limit: 10000,
          },
          { authMode: "userPool" }
        );
        if (errors?.length) throw errors;

        const list = data ?? [];

        // practiceCode が "PR-" 以外（表題混入など）は落とす
        const onlyPR = list.filter((r) => s((r as any).practiceCode).startsWith("PR-"));

        const sorted = [...onlyPR].sort((a, b) => {
          const av = Number((a as any)[sortKey] ?? 0);
          const bv = Number((b as any)[sortKey] ?? 0);
          return bv - av;
        });

        setRows(sorted);

        // ★検索結果が変わったらページを先頭へ
        setPage(0);
      } catch (e: any) {
        setError(e?.message ?? JSON.stringify(e, null, 2));
        setRows([]);
      } finally {
        setLoadingAgg(false);
      }
    })();
  }, [client, selectedAbility, sortKey]);

  // ----------------------------
  // 3) PracticeCode をまとめて引く
  // ----------------------------
  useEffect(() => {
    (async () => {
      setLoadingPractice(true);
      setError("");

      try {
        const codes = Array.from(
          new Set(rows.map((r) => s((r as any).practiceCode)).filter((c) => c.startsWith("PR-")))
        );

        if (codes.length === 0) {
          setPracticeByCode({});
          setPracticeHitCount(0);
          return;
        }

        const baseMap: PracticeMap = practiceReloadKey ? {} : { ...practiceByCode };
        const need = codes.filter((c) => !baseMap[c]);
        if (need.length === 0) {
          setPracticeByCode(baseMap);
          setPracticeHitCount(Object.keys(baseMap).length);
          return;
        }

        const batches = chunk(need, 20);

        for (const batch of batches) {
          const or = batch.map((pc) => ({ practice_code: { eq: pc } }));

          const { data, errors } = await client.models.PracticeCode.list(
            { filter: { or }, limit: 10000 },
            { authMode: "userPool" }
          );
          if (errors?.length) throw errors;

          for (const it of data ?? []) {
            const pc = s((it as any).practice_code);
            if (!pc) continue;

            baseMap[pc] = {
              practice_code: pc,
              category_name: (it as any).category_name ?? null,
              name: (it as any).name ?? null,
              memo: (it as any).memo ?? null,
              source_url: (it as any).source_url ?? null,
              source_type: (it as any).source_type ?? null,
              status: (it as any).status ?? null,
            };
          }
        }

        setPracticeByCode(baseMap);
        setPracticeHitCount(Object.keys(baseMap).length);
      } catch (e: any) {
        setError(e?.message ?? JSON.stringify(e, null, 2));
      } finally {
        setLoadingPractice(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, rows, practiceReloadKey]);

  // ----------------------------
  // 4) 親子表示（optgroup）
  // ----------------------------
  const abilityGroups = useMemo(() => {
    const parents = abilityOptions.filter((a) => Number((a as any).level) === 1);
    const children = abilityOptions.filter((a) => Number((a as any).level) === 2);

    const childrenByParent = new Map<string, Array<Schema["AbilityCode"]["type"]>>();
    for (const c of children) {
      const parentCode = s((c as any).parent_code);
      if (!childrenByParent.has(parentCode)) childrenByParent.set(parentCode, []);
      childrenByParent.get(parentCode)!.push(c);
    }

    for (const [k, arr] of childrenByParent.entries()) {
      arr.sort((a, b) => {
        const sa = Number((a as any).sort_order ?? 999999);
        const sb = Number((b as any).sort_order ?? 999999);
        if (sa !== sb) return sa - sb;
        return s((a as any).code).localeCompare(s((b as any).code));
      });
      childrenByParent.set(k, arr);
    }

    parents.sort((a, b) => {
      const sa = Number((a as any).sort_order ?? 999999);
      const sb = Number((b as any).sort_order ?? 999999);
      if (sa !== sb) return sa - sb;
      return s((a as any).code).localeCompare(s((b as any).code));
    });

    return { parents, childrenByParent };
  }, [abilityOptions]);

  const selectedAbilityLabel = useMemo(() => {
    const a = abilityOptions.find((x) => String(x.code) === String(selectedAbility));
    if (!a) return "";
    const level = Number((a as any).level);
    const prefix = level === 1 ? "大分類" : level === 2 ? "中分類" : "小分類";
    return `${prefix}：${s((a as any).name)}（${s((a as any).code)}）`;
  }, [abilityOptions, selectedAbility]);

  const totalScoreSum = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number((r as any).scoreSum ?? 0), 0);
  }, [rows]);

  // ★ページング計算
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(page, 0), totalPages - 1);

  const pageRows = useMemo(() => {
    const start = clampedPage * pageSize;
    const end = start + pageSize;
    return rows.slice(start, end);
  }, [rows, clampedPage, pageSize]);

  const from = totalRows === 0 ? 0 : clampedPage * pageSize + 1;
  const to = Math.min(totalRows, (clampedPage + 1) * pageSize);

  const loading = loadingAbility || loadingAgg || loadingPractice;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Practice検索（Ability → おすすめPractice）</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Ability（大/中分類）
          <select
            value={selectedAbility}
            onChange={(e) => setSelectedAbility(e.target.value)}
            style={{ minWidth: 420 }}
            disabled={loadingAbility || abilityOptions.length === 0}
          >
            {abilityOptions.length === 0 ? (
              <option value="">（AbilityCodeが取得できていません）</option>
            ) : (
              <>
                {abilityGroups.parents.map((p) => {
                  const pCode = s((p as any).code);
                  const label = `【大】${s((p as any).name)}（${pCode}）`;
                  const kids = abilityGroups.childrenByParent.get(pCode) ?? [];

                  return (
                    <optgroup key={pCode} label={label}>
                      {kids.length === 0 ? (
                        <option value={pCode}>{label}</option>
                      ) : (
                        kids.map((c) => (
                          <option key={s((c as any).code)} value={s((c as any).code)}>
                            {`【中】${s((c as any).name)}（${s((c as any).code)}）`}
                          </option>
                        ))
                      )}
                    </optgroup>
                  );
                })}
              </>
            )}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          ソート
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="scoreSum">scoreSum（合計）</option>
            <option value="scoreMax">scoreMax（最大）</option>
            <option value="linkCount">linkCount（件数）</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          1ページ表示
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            <option value={4}>4件</option>
            <option value={5}>5件</option>
            <option value={10}>10件</option>
            <option value={20}>20件</option>
          </select>
        </label>

        <button
          onClick={() => {
            setPracticeByCode({});
            setPracticeHitCount(0);
            setPracticeReloadKey((k) => k + 1);
          }}
          disabled={loading || rows.length === 0}
          title="Practiceマスタ（PracticeCode）を再取得します"
        >
          Refresh（Practice再取得）
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.85 }}>
        AbilityCode取得件数（raw）：{abilityRawCount} / プルダウン表示件数（level1/2 & active）：{abilityOptions.length}
        <br />
        選択中：{selectedAbilityLabel || "（未選択）"} / 結果件数：{rows.length} / scoreSum合計：{totalScoreSum}
        <br />
        表示範囲：{from}〜{to} / {totalRows}（ページ {clampedPage + 1} / {totalPages}）
      </div>

      {error && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
          Error: {error}
        </div>
      )}
      {loading && <div>Loading...</div>}

      {/* ★ページング操作 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => setPage(0)} disabled={clampedPage === 0 || totalRows === 0}>
          ⏮ 最初
        </button>
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={clampedPage === 0 || totalRows === 0}>
          ◀ 前へ
        </button>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          {clampedPage + 1} / {totalPages}
        </div>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={clampedPage >= totalPages - 1 || totalRows === 0}
        >
          次へ ▶
        </button>
        <button
          onClick={() => setPage(totalPages - 1)}
          disabled={clampedPage >= totalPages - 1 || totalRows === 0}
        >
          最後 ⏭
        </button>
      </div>

      {/* ★横はみ出し対策：スクロールさせる */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 12, background: "#fafafa", borderBottom: "1px solid #eee" }}>
          結果一覧（Practice）
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 12 }}>データがありません。</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>practice</th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>scoreSum</th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>scoreMax</th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>linkCount</th>
                  <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>abilityLevel</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const pc = s((r as any).practiceCode);
                  const pm = practiceByCode[pc];

                  const title = pm?.name ? pm.name : pc;
                  const memo = pm?.memo ?? "";
                  const url = pm?.source_url ?? "";
                  const status = pm?.status ?? "";
                  const sourceType = pm?.source_type ?? "";
                  const category = pm?.category_name ?? "";

                  return (
                    <tr key={`${s((r as any).abilityCode)}|${pc}`}>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ fontWeight: 600 }}>{title}</div>
                        <div style={{ fontSize: 12, opacity: 0.85 }}>
                          {pc}
                          {category ? ` / ${category}` : ""}
                        </div>
                        {(sourceType || status) && (
                          <div style={{ fontSize: 12, opacity: 0.75 }}>
                            {sourceType ? `source=${sourceType}` : ""}
                            {sourceType && status ? " / " : ""}
                            {status ? `status=${status}` : ""}
                          </div>
                        )}
                        {memo && (
                          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.9, whiteSpace: "pre-wrap" }}>
                            {memo}
                          </div>
                        )}
                        {url && (
                          <div style={{ marginTop: 4, fontSize: 12 }}>
                            <a href={url} target="_blank" rel="noreferrer">
                              {url}
                            </a>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{(r as any).scoreSum}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{(r as any).scoreMax}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{(r as any).linkCount}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{(r as any).level}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        ※ いまは「フロントでページング」です（最短）。データ件数が増えて重くなってきたら、次はDB側のページング（nextToken）に移行できます。
      </div>
    </div>
  );
}
