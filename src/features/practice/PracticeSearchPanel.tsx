// src/features/practice/PracticeSearchPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type SortKey = "scoreSum" | "scoreMax" | "linkCount";
type ViewMode = "ability" | "debug";

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

function previewText(v: unknown, max = 120): string {
  const text = s(v).replace(/\s+/g, " ");
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max) + "…";
}

function buildAbilityMaps(codes: Array<Schema["AbilityCode"]["type"]>) {
  const byCode = new Map<string, Schema["AbilityCode"]["type"]>();
  for (const c of codes) {
    byCode.set(String(c.code), c);
  }

  function buildCodeName(code: string): string {
    const item = byCode.get(code);
    if (!item) return code;
    return `${s(item.code)}_${s(item.name)}`;
  }

  function buildParentLabel(code: string): string {
    const item = byCode.get(code);
    if (!item) return "-";

    const parentCode = s((item as any).parent_code);
    if (!parentCode) return "-";

    const parent = byCode.get(parentCode);
    if (!parent) return parentCode;

    return `${s(parent.code)}_${s(parent.name)}`;
  }

  return { byCode, buildCodeName, buildParentLabel };
}

export default function PracticeSearchPanel(_props: { owner?: string }) {
  const client = useMemo(() => generateClient<Schema>(), []);

  const [viewMode, setViewMode] = useState<ViewMode>("ability");

  const [abilityRawCount, setAbilityRawCount] = useState(0);
  const [abilityOptions, setAbilityOptions] = useState<
    Array<Schema["AbilityCode"]["type"]>
  >([]);
  const [allAbilityCodes, setAllAbilityCodes] = useState<
    Array<Schema["AbilityCode"]["type"]>
  >([]);
  const [selectedAbility, setSelectedAbility] = useState<string>("");

  const [sortKey, setSortKey] = useState<SortKey>("scoreSum");
  const [rows, setRows] = useState<Array<Schema["AbilityPracticeAgg"]["type"]>>(
    [],
  );

  const [practiceByCode, setPracticeByCode] = useState<PracticeMap>({});

  const [loadingAbility, setLoadingAbility] = useState(false);
  const [loadingAgg, setLoadingAgg] = useState(false);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [error, setError] = useState<string>("");

  const [practiceReloadKey, setPracticeReloadKey] = useState(0);

  const [pageSize, setPageSize] = useState<number>(5);
  const [page, setPage] = useState<number>(0);

  const [suggestionPage, setSuggestionPage] = useState(0);
  const [suggestionPageSize, setSuggestionPageSize] = useState(5);

  const [debugRows, setDebugRows] = useState<Array<Schema["PracticeCode"]["type"]>>(
    [],
  );
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [debugFilter, setDebugFilter] = useState("");
  const [debugStatusFilter, setDebugStatusFilter] = useState("");

  const [analyzingPracticeId, setAnalyzingPracticeId] = useState("");
  const [analyzeMessage, setAnalyzeMessage] = useState("");

  const [suggestingPracticeId, setSuggestingPracticeId] = useState("");
  const [suggestMessage, setSuggestMessage] = useState("");

  const [registeringPracticeCode, setRegisteringPracticeCode] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");

  const [selectedPracticeCode, setSelectedPracticeCode] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<Schema["PracticeLinkSuggestion"]["type"]>
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [savingSuggestionId, setSavingSuggestionId] = useState("");

  useEffect(() => {
    (async () => {
      setLoadingAbility(true);
      setError("");
      try {
        const { data, errors } = await client.models.AbilityCode.list({
          authMode: "userPool",
          limit: 10000,
        });

        if (errors?.length) {
          throw new Error(errors.map((e) => e.message).join("\n"));
        }

        const raw = data ?? [];
        setAbilityRawCount(raw.length);
        setAllAbilityCodes(raw);

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

        const first =
          items.find((i) => Number((i as any).level) === 2) ?? items[0];
        if (first?.code) setSelectedAbility(String(first.code));
      } catch (e: any) {
        setError(e?.message ?? JSON.stringify(e, null, 2));
        setAbilityRawCount(0);
        setAbilityOptions([]);
        setAllAbilityCodes([]);
        setSelectedAbility("");
      } finally {
        setLoadingAbility(false);
      }
    })();
  }, [client]);

  useEffect(() => {
    if (!selectedAbility) {
      setRows([]);
      return;
    }

    (async () => {
      setLoadingAgg(true);
      setError("");
      try {
        const { data, errors } = await client.models.AbilityPracticeAgg.list({
          authMode: "userPool",
          filter: { abilityCode: { eq: selectedAbility } },
          limit: 10000,
        });

        if (errors?.length) {
          throw new Error(errors.map((e) => e.message).join("\n"));
        }

        const list = data ?? [];
        const onlyPR = list.filter((r) =>
          s((r as any).practiceCode).startsWith("PR-"),
        );

        const sorted = [...onlyPR].sort((a, b) => {
          const av = Number((a as any)[sortKey] ?? 0);
          const bv = Number((b as any)[sortKey] ?? 0);
          return bv - av;
        });

        setRows(sorted);
        setPage(0);
      } catch (e: any) {
        setError(e?.message ?? JSON.stringify(e, null, 2));
        setRows([]);
      } finally {
        setLoadingAgg(false);
      }
    })();
  }, [client, selectedAbility, sortKey]);

  useEffect(() => {
    (async () => {
      setLoadingPractice(true);
      setError("");

      try {
        const codes = Array.from(
          new Set(
            rows
              .map((r) => s((r as any).practiceCode))
              .filter((c) => c.startsWith("PR-")),
          ),
        );

        if (codes.length === 0) {
          setPracticeByCode({});
          return;
        }

        const baseMap: PracticeMap = practiceReloadKey
          ? {}
          : { ...practiceByCode };
        const need = codes.filter((c) => !baseMap[c]);
        if (need.length === 0) {
          setPracticeByCode(baseMap);
          return;
        }

        const batches = chunk(need, 20);

        for (const batch of batches) {
          const or = batch.map((pc) => ({ practice_code: { eq: pc } }));

          const { data, errors } = await client.models.PracticeCode.list({
            authMode: "userPool",
            filter: { or },
            limit: 10000,
          });

          if (errors?.length) {
            throw new Error(errors.map((e) => e.message).join("\n"));
          }

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
      } catch (e: any) {
        setError(e?.message ?? JSON.stringify(e, null, 2));
      } finally {
        setLoadingPractice(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, rows, practiceReloadKey]);

  useEffect(() => {
    if (viewMode !== "debug") return;

    (async () => {
      setLoadingDebug(true);
      setError("");
      try {
        const { data, errors } = await client.models.PracticeCode.list({
          authMode: "userPool",
          limit: 10000,
        });

        if (errors?.length) {
          throw new Error(errors.map((e) => e.message).join("\n"));
        }

        const list = (data ?? []).filter((x) =>
          s((x as any).practice_code).startsWith("PR-"),
        );

        list.sort((a, b) => {
          const ra = s((a as any).recordedAt);
          const rb = s((b as any).recordedAt);
          return rb.localeCompare(ra);
        });

        setDebugRows(list);
        setPage(0);
      } catch (e: any) {
        setError(e?.message ?? JSON.stringify(e, null, 2));
        setDebugRows([]);
      } finally {
        setLoadingDebug(false);
      }
    })();
  }, [client, viewMode, practiceReloadKey]);

  useEffect(() => {
    if (!selectedPracticeCode) {
      setSuggestions([]);
      return;
    }

    (async () => {
      setLoadingSuggestions(true);
      setError("");
      try {
        const { data, errors } =
          await client.models.PracticeLinkSuggestion.list({
            authMode: "userPool",
            filter: {
              practiceCode: { eq: selectedPracticeCode },
            },
            limit: 1000,
          });

        if (errors?.length) {
          throw new Error(errors.map((e) => e.message).join("\n"));
        }

        const list = [...(data ?? [])].sort((a, b) => {
          const sa = Number((a as any).sortOrder ?? 9999);
          const sb = Number((b as any).sortOrder ?? 9999);
          return sa - sb;
        });

        setSuggestions(list);
        setSuggestionPage(0);
      } catch (e: any) {
        setError(e?.message ?? JSON.stringify(e, null, 2));
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    })();
  }, [client, selectedPracticeCode, practiceReloadKey]);

  const abilityGroups = useMemo(() => {
    const parents = abilityOptions.filter(
      (a) => Number((a as any).level) === 1,
    );
    const children = abilityOptions.filter(
      (a) => Number((a as any).level) === 2,
    );

    const childrenByParent = new Map<
      string,
      Array<Schema["AbilityCode"]["type"]>
    >();
    for (const c of children) {
      const parentCode = s((c as any).parent_code);
      if (!childrenByParent.has(parentCode)) {
        childrenByParent.set(parentCode, []);
      }
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
    const a = abilityOptions.find(
      (x) => String(x.code) === String(selectedAbility),
    );
    if (!a) return "";
    const level = Number((a as any).level);
    const prefix = level === 1 ? "大分類" : level === 2 ? "中分類" : "小分類";
    return `${prefix}：${s((a as any).name)}（${s((a as any).code)}）`;
  }, [abilityOptions, selectedAbility]);

  const totalScoreSum = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number((r as any).scoreSum ?? 0), 0);
  }, [rows]);

  const filteredDebugRows = useMemo(() => {
    const q = s(debugFilter).toLowerCase();
    const st = s(debugStatusFilter).toUpperCase();

    return debugRows.filter((r) => {
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
  }, [debugRows, debugFilter, debugStatusFilter]);

  const { buildCodeName, buildParentLabel } = useMemo(
    () => buildAbilityMaps(allAbilityCodes),
    [allAbilityCodes],
  );

  const sourceRows = viewMode === "ability" ? rows : filteredDebugRows;

  const totalRows = sourceRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(Math.max(page, 0), totalPages - 1);

  const pageRows = useMemo(() => {
    const start = clampedPage * pageSize;
    const end = start + pageSize;
    return sourceRows.slice(start, end);
  }, [sourceRows, clampedPage, pageSize]);

  const from = totalRows === 0 ? 0 : clampedPage * pageSize + 1;
  const to = Math.min(totalRows, (clampedPage + 1) * pageSize);

  const suggestionTotalRows = suggestions.length;
  const suggestionTotalPages = Math.max(
    1,
    Math.ceil(suggestionTotalRows / suggestionPageSize),
  );
  const suggestionClampedPage = Math.min(
    Math.max(suggestionPage, 0),
    suggestionTotalPages - 1,
  );

  const pagedSuggestions = useMemo(() => {
    const start = suggestionClampedPage * suggestionPageSize;
    const end = start + suggestionPageSize;
    return suggestions.slice(start, end);
  }, [suggestions, suggestionClampedPage, suggestionPageSize]);

  const suggestionFrom =
    suggestionTotalRows === 0
      ? 0
      : suggestionClampedPage * suggestionPageSize + 1;
  const suggestionTo = Math.min(
    suggestionTotalRows,
    (suggestionClampedPage + 1) * suggestionPageSize,
  );

  const loading =
    loadingAbility ||
    loadingAgg ||
    loadingPractice ||
    loadingDebug ||
    loadingSuggestions;

  async function handleAnalyzePractice(practiceId: string) {
    setAnalyzeMessage("");
    setSuggestMessage("");
    setRegisterMessage("");
    setError("");
    setAnalyzingPracticeId(practiceId);

    try {
      const result = await client.mutations.analyzePractice({
        practiceId,
      });

      if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join("\n"));
      }

      const name = s(result.data?.name);
      setAnalyzeMessage(
        name ? `AI生成が完了しました: ${name}` : "AI生成が完了しました。",
      );

      setPracticeReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message ?? "AI生成に失敗しました。");
    } finally {
      setAnalyzingPracticeId("");
    }
  }

  async function handleSuggestLinks(practiceId: string, practiceCode: string) {
    setSuggestMessage("");
    setAnalyzeMessage("");
    setRegisterMessage("");
    setError("");
    setSuggestingPracticeId(practiceId);

    try {
      const result = await client.mutations.suggestPracticeLinks({
        practiceId,
      });

      if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join("\n"));
      }

      const count = Number(result.data?.suggestionCount ?? 0);
      setSuggestMessage(`AI候補生成が完了しました: ${count}件`);
      setSelectedPracticeCode(practiceCode);
      setPracticeReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message ?? "Ability候補生成に失敗しました。");
    } finally {
      setSuggestingPracticeId("");
    }
  }

  async function updateSuggestionStatus(
    row: Schema["PracticeLinkSuggestion"]["type"],
    checked: boolean,
  ) {
    setError("");
    setSavingSuggestionId(row.id);

    try {
      const nextStatus = checked ? "accepted" : "rejected";

      const result = await client.models.PracticeLinkSuggestion.update({
        id: row.id,
        tenantId: row.tenantId,
        practiceCode: row.practiceCode,
        abilityCode: row.abilityCode,
        score: Number((row as any).score ?? 1),
        reason: row.reason ?? "",
        status: nextStatus,
        sortOrder: Number((row as any).sortOrder ?? 0),
        createdBy: row.createdBy ?? undefined,
        updatedBy: "practice-search-panel",
      });

      if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join("\n"));
      }

      setPracticeReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message ?? "候補ステータス更新に失敗しました。");
    } finally {
      setSavingSuggestionId("");
    }
  }

  async function updateSuggestionScore(
    row: Schema["PracticeLinkSuggestion"]["type"],
    score: number,
  ) {
    setError("");
    setSavingSuggestionId(row.id);

    try {
      const currentStatus = s((row as any).status).toLowerCase();
      const nextStatus =
        currentStatus === "accepted" ? "edited" : "edited";

      const result = await client.models.PracticeLinkSuggestion.update({
        id: row.id,
        tenantId: row.tenantId,
        practiceCode: row.practiceCode,
        abilityCode: row.abilityCode,
        score,
        reason: row.reason ?? "",
        status: nextStatus,
        sortOrder: Number((row as any).sortOrder ?? 0),
        createdBy: row.createdBy ?? undefined,
        updatedBy: "practice-search-panel",
      });

      if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join("\n"));
      }

      setPracticeReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message ?? "score更新に失敗しました。");
    } finally {
      setSavingSuggestionId("");
    }
  }

  async function handleRegisterPracticeLinks(practiceCode: string) {
    setRegisterMessage("");
    setError("");
    setRegisteringPracticeCode(practiceCode);

    try {
      const result = await client.mutations.registerPracticeLinks({
        practiceCode,
      });

      if (result.errors?.length) {
        throw new Error(result.errors.map((e) => e.message).join("\n"));
      }

      const count = Number(result.data?.registeredCount ?? 0);
      setRegisterMessage(`本登録が完了しました: ${count}件`);
      setPracticeReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message ?? "本登録に失敗しました。");
    } finally {
      setRegisteringPracticeCode("");
    }
  }

  const acceptedCount = useMemo(() => {
    return suggestions.filter((x) => {
      const st = s((x as any).status).toLowerCase();
      return st === "accepted" || st === "edited";
    }).length;
  }, [suggestions]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Practice検索 / Practice一覧</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => {
            setViewMode("ability");
            setPage(0);
          }}
          disabled={viewMode === "ability"}
        >
          Ability起点
        </button>
        <button
          onClick={() => {
            setViewMode("debug");
            setPage(0);
          }}
          disabled={viewMode === "debug"}
        >
          Practice一覧（確認用）
        </button>
        <button
          onClick={() => {
            setPracticeByCode({});
            setPracticeReloadKey((k) => k + 1);
          }}
          disabled={loading}
          title="PracticeCode を再取得します"
        >
          Refresh
        </button>
      </div>

      {viewMode === "ability" ? (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
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
                              <option
                                key={s((c as any).code)}
                                value={s((c as any).code)}
                              >
                                {`【中】${s((c as any).name)}（${s(
                                  (c as any).code,
                                )}）`}
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
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
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
          </div>

          <div style={{ fontSize: 12, opacity: 0.85 }}>
            AbilityCode取得件数（raw）：{abilityRawCount} /
            プルダウン表示件数（level1/2 & active）：{abilityOptions.length}
            <br />
            選択中：{selectedAbilityLabel || "（未選択）"} / 結果件数：
            {rows.length} / scoreSum合計：{totalScoreSum}
            <br />
            表示範囲：{from}〜{to} / {totalRows}（ページ {clampedPage + 1} /{" "}
            {totalPages}）
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              検索
              <input
                value={debugFilter}
                onChange={(e) => {
                  setDebugFilter(e.target.value);
                  setPage(0);
                }}
                placeholder="practice_code / name / transcript で検索"
                style={{ minWidth: 360 }}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              status
              <select
                value={debugStatusFilter}
                onChange={(e) => {
                  setDebugStatusFilter(e.target.value);
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

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                <option value={50}>50件</option>
              </select>
            </label>
          </div>

          <div style={{ fontSize: 12, opacity: 0.85 }}>
            PracticeCode件数：{debugRows.length} / 絞込後：
            {filteredDebugRows.length}
            <br />
            表示範囲：{from}〜{to} / {totalRows}（ページ {clampedPage + 1} /{" "}
            {totalPages}）
          </div>
        </>
      )}

      {analyzeMessage && (
        <div
          style={{
            padding: 10,
            background: "#f4fbf4",
            border: "1px solid #cde8cd",
            borderRadius: 6,
            color: "#1d5e20",
          }}
        >
          {analyzeMessage}
        </div>
      )}

      {suggestMessage && (
        <div
          style={{
            padding: 10,
            background: "#f4f8ff",
            border: "1px solid #cddcf7",
            borderRadius: 6,
            color: "#1b4d8a",
          }}
        >
          {suggestMessage}
        </div>
      )}

      {registerMessage && (
        <div
          style={{
            padding: 10,
            background: "#fff8e8",
            border: "1px solid #ead8a2",
            borderRadius: 6,
            color: "#7a5a00",
          }}
        >
          {registerMessage}
        </div>
      )}

      {error && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
          Error: {error}
        </div>
      )}
      {loading && <div>Loading...</div>}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => setPage(0)}
          disabled={clampedPage === 0 || totalRows === 0}
        >
          ⏮ 最初
        </button>
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={clampedPage === 0 || totalRows === 0}
        >
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

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 12,
            background: "#fafafa",
            borderBottom: "1px solid #eee",
          }}
        >
          {viewMode === "ability"
            ? "結果一覧（Ability起点）"
            : "Practice一覧（確認用）"}
        </div>

        {totalRows === 0 ? (
          <div style={{ padding: 12 }}>データがありません。</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {viewMode === "ability" ? (
              <table
                style={{
                  width: "100%",
                  minWidth: 900,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      practice
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      scoreSum
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      scoreMax
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      linkCount
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      abilityLevel
                    </th>
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
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
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
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 12,
                                opacity: 0.9,
                                whiteSpace: "pre-wrap",
                              }}
                            >
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
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {(r as any).scoreSum}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {(r as any).scoreMax}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {(r as any).linkCount}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {(r as any).level}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table
                style={{
                  width: "100%",
                  minWidth: 1750,
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
                      transcribe
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      category
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      visibility
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      recordedAt
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      transcript preview
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      memo preview
                    </th>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => {
                    const practice = r as Schema["PracticeCode"]["type"];
                    const practiceCode = s((practice as any).practice_code);
                    const name = s((practice as any).name);
                    const status = s((practice as any).status);
                    const transcribeStatus = s(
                      (practice as any).transcribeStatus,
                    );
                    const practiceCategory = s(
                      (practice as any).practiceCategory,
                    );
                    const visibility = s((practice as any).visibility);
                    const recordedAt = s((practice as any).recordedAt);
                    const transcriptPreview = previewText(
                      (practice as any).transcriptText,
                      160,
                    );
                    const memoPreview = previewText((practice as any).memo, 120);
                    const canAnalyze =
                      status === "REVIEW" &&
                      transcribeStatus === "COMPLETED" &&
                      s((practice as any).transcriptText) !== "";
                    const canSuggest =
                      status === "REVIEW" &&
                      s((practice as any).name) !== "" &&
                      s((practice as any).memo) !== "";

                    return (
                      <tr key={practice.id}>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {name || "(no name)"}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>
                            {practiceCode}
                          </div>
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {status || "-"}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {transcribeStatus || "-"}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {practiceCategory || "-"}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {visibility || "-"}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          {recordedAt || "-"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            fontSize: 12,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {transcriptPreview || "-"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            borderBottom: "1px solid #f0f0f0",
                            fontSize: 12,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {memoPreview || "-"}
                        </td>
                        <td
                          style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}
                        >
                          <div style={{ display: "grid", gap: 6 }}>
                            <button
                              onClick={() => handleAnalyzePractice(practice.id)}
                              disabled={
                                !canAnalyze ||
                                analyzingPracticeId === practice.id
                              }
                            >
                              {analyzingPracticeId === practice.id
                                ? "AI生成中..."
                                : "AIで名前と要約を作る"}
                            </button>

                            <button
                              onClick={() =>
                                handleSuggestLinks(practice.id, practiceCode)
                              }
                              disabled={
                                !canSuggest ||
                                suggestingPracticeId === practice.id
                              }
                            >
                              {suggestingPracticeId === practice.id
                                ? "候補生成中..."
                                : "AIでAbility候補を作る"}
                            </button>

                            <button
                              onClick={() => setSelectedPracticeCode(practiceCode)}
                              disabled={!practiceCode}
                            >
                              候補を見る
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {viewMode === "debug" && selectedPracticeCode ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 12,
              background: "#fafafa",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>Ability候補（階層表示）: {selectedPracticeCode}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                1ページ表示
                <select
                  value={suggestionPageSize}
                  onChange={(e) => {
                    setSuggestionPageSize(Number(e.target.value));
                    setSuggestionPage(0);
                  }}
                >
                  <option value={5}>5件</option>
                  <option value={10}>10件</option>
                  <option value={20}>20件</option>
                </select>
              </label>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {suggestionFrom}〜{suggestionTo} / {suggestionTotalRows}
              </div>
              <button
                onClick={() => handleRegisterPracticeLinks(selectedPracticeCode)}
                disabled={
                  !selectedPracticeCode ||
                  acceptedCount === 0 ||
                  registeringPracticeCode === selectedPracticeCode
                }
              >
                {registeringPracticeCode === selectedPracticeCode
                  ? "本登録中..."
                  : `本登録する（${acceptedCount}件）`}
              </button>
            </div>
          </div>

          {loadingSuggestions ? (
            <div style={{ padding: 12 }}>候補を読み込み中...</div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: 12 }}>候補はまだありません。</div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 1100,
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        採用
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        階層
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        コード
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        score
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        reason
                      </th>
                      <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                        status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSuggestions.map((row) => {
                      const abilityCode = s((row as any).abilityCode);
                      const parentLabel = buildParentLabel(abilityCode);
                      const selfLabel = buildCodeName(abilityCode);
                      const rowStatus = s((row as any).status).toLowerCase();
                      const checked =
                        rowStatus === "accepted" || rowStatus === "edited";

                      return (
                        <tr key={row.id}>
                          <td
                            style={{
                              padding: 8,
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={savingSuggestionId === row.id}
                              onChange={(e) =>
                                updateSuggestionStatus(row, e.target.checked)
                              }
                            />
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            {parentLabel}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            {selfLabel}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            <select
                              value={Number((row as any).score ?? 1)}
                              disabled={savingSuggestionId === row.id}
                              onChange={(e) =>
                                updateSuggestionScore(
                                  row,
                                  Number(e.target.value),
                                )
                              }
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </select>
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderBottom: "1px solid #f0f0f0",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {s((row as any).reason) || "-"}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            {s((row as any).status) || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  padding: 12,
                  borderTop: "1px solid #eee",
                }}
              >
                <button
                  onClick={() => setSuggestionPage(0)}
                  disabled={suggestionClampedPage === 0}
                >
                  ⏮ 最初
                </button>
                <button
                  onClick={() => setSuggestionPage((p) => Math.max(0, p - 1))}
                  disabled={suggestionClampedPage === 0}
                >
                  ◀ 前へ
                </button>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  {suggestionClampedPage + 1} / {suggestionTotalPages}
                </div>
                <button
                  onClick={() =>
                    setSuggestionPage((p) =>
                      Math.min(suggestionTotalPages - 1, p + 1),
                    )
                  }
                  disabled={suggestionClampedPage >= suggestionTotalPages - 1}
                >
                  次へ ▶
                </button>
                <button
                  onClick={() => setSuggestionPage(suggestionTotalPages - 1)}
                  disabled={suggestionClampedPage >= suggestionTotalPages - 1}
                >
                  最後 ⏭
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        ※ Ability起点は AbilityPracticeAgg に存在する Practice だけが表示されます。
        <br />
        新規登録した Practice の確認と AI 実行は「Practice一覧（確認用）」を使います。
      </div>
    </div>
  );
}