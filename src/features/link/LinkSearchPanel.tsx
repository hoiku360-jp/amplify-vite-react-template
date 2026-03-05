// src/features/link/LinkSearchPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

function s(v: unknown): string {
  return String(v ?? "").trim();
}

type APLink = Schema["AbilityPracticeLink"]["type"];

export default function LinkSearchPanel() {
  const client = useMemo(() => generateClient<Schema>(), []);

  const [abilityCode, setAbilityCode] = useState("2102001");
  const [practiceCode, setPracticeCode] = useState("PR-OUT-0001");

  // ---- AP1 state ----
  const [ap1Items, setAp1Items] = useState<APLink[]>([]);
  const [ap1NextToken, setAp1NextToken] = useState<string | null>(null);

  // ---- AP2 state ----
  const [ap2Items, setAp2Items] = useState<APLink[]>([]);
  const [ap2NextToken, setAp2NextToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const PAGE_SIZE = 20;

  // 重複排除（同一 ability|practice の混入をUI側でも防ぐ）
  function uniq(arr: APLink[], keyFn: (x: APLink) => string) {
    const seen = new Set<string>();
    const out: APLink[] = [];
    for (const x of arr) {
      const k = keyFn(x);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(x);
    }
    return out;
  }

  async function runAP1(reset: boolean) {
    const a = s(abilityCode);
    if (!a) return;

    setLoading(true);
    setError("");

    try {
      const resp = await client.models.AbilityPracticeLink.listByAbility(
        // ✅ input は indexキーだけ
        { abilityCode: a },
        // ✅ limit / nextToken は options 側
        {
          authMode: "userPool",
          limit: PAGE_SIZE,
          nextToken: reset ? null : ap1NextToken,
        }
      );

      if (resp.errors?.length) {
        throw new Error(resp.errors.map((e) => e.message).join("\n"));
      }

      const newItems = (resp.data ?? []) as APLink[];
      setAp1NextToken((resp.nextToken ?? null) as string | null);

      if (reset) {
        setAp1Items(newItems);
      } else {
        setAp1Items((prev) =>
          uniq(
            [...prev, ...newItems],
            (x) => `${s((x as any).abilityCode)}|${s((x as any).practiceCode)}`
          )
        );
      }
    } catch (e: any) {
      setError(e?.message ?? JSON.stringify(e, null, 2));
      if (reset) {
        setAp1Items([]);
        setAp1NextToken(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function runAP2(reset: boolean) {
    const p = s(practiceCode);
    if (!p) return;

    setLoading(true);
    setError("");

    try {
      const resp = await client.models.AbilityPracticeLink.listByPractice(
        // ✅ input は indexキーだけ
        { practiceCode: p },
        // ✅ limit / nextToken は options 側
        {
          authMode: "userPool",
          limit: PAGE_SIZE,
          nextToken: reset ? null : ap2NextToken,
        }
      );

      if (resp.errors?.length) {
        throw new Error(resp.errors.map((e) => e.message).join("\n"));
      }

      const newItems = (resp.data ?? []) as APLink[];
      setAp2NextToken((resp.nextToken ?? null) as string | null);

      if (reset) {
        setAp2Items(newItems);
      } else {
        setAp2Items((prev) =>
          uniq(
            [...prev, ...newItems],
            (x) => `${s((x as any).practiceCode)}|${s((x as any).abilityCode)}`
          )
        );
      }
    } catch (e: any) {
      setError(e?.message ?? JSON.stringify(e, null, 2));
      if (reset) {
        setAp2Items([]);
        setAp2NextToken(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function resetAP1() {
    setAp1Items([]);
    setAp1NextToken(null);
  }

  function resetAP2() {
    setAp2Items([]);
    setAp2NextToken(null);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Link検索（AP1/AP2）</h2>

      <div style={{ fontSize: 12, opacity: 0.85 }}>
        ページング：limit={PAGE_SIZE} / nextToken による「追加読み込み（Load more）」方式
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          abilityCode（小分類）
          <input
            value={abilityCode}
            onChange={(e) => {
              setAbilityCode(e.target.value);
              resetAP1();
            }}
            style={{ width: 160 }}
          />
        </label>

        <button onClick={() => runAP1(true)} disabled={loading || !s(abilityCode)}>
          AP1 初回検索
        </button>
        <button onClick={() => runAP1(false)} disabled={loading || !ap1NextToken}>
          AP1 追加読み込み
        </button>

        <span style={{ opacity: 0.6 }}>|</span>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          practiceCode
          <input
            value={practiceCode}
            onChange={(e) => {
              setPracticeCode(e.target.value);
              resetAP2();
            }}
            style={{ width: 180 }}
          />
        </label>

        <button onClick={() => runAP2(true)} disabled={loading || !s(practiceCode)}>
          AP2 初回検索
        </button>
        <button onClick={() => runAP2(false)} disabled={loading || !ap2NextToken}>
          AP2 追加読み込み
        </button>

        <button
          onClick={() => {
            setError("");
            resetAP1();
            resetAP2();
          }}
          disabled={loading}
          title="結果とnextTokenをリセットします"
          style={{ marginLeft: 8 }}
        >
          Clear
        </button>
      </div>

      {error && <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>Error: {error}</div>}
      {loading && <div>Loading...</div>}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        {/* AP1 */}
        <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: 10, background: "#fafafa", borderBottom: "1px solid #eee" }}>
            AP1 結果（abilityCode → practiceCode, score）
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              件数: {ap1Items.length} / nextToken: {ap1NextToken ? "あり" : "なし"}
            </div>
          </div>
          <div style={{ padding: 10 }}>
            {ap1Items.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.8 }}>（結果なし）</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {ap1Items.map((r) => (
                  <li key={`${s((r as any).abilityCode)}|${s((r as any).practiceCode)}`}>
                    {String((r as any).practiceCode)} / score={String((r as any).score)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* AP2 */}
        <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: 10, background: "#fafafa", borderBottom: "1px solid #eee" }}>
            AP2 結果（practiceCode → abilityCode, score）
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              件数: {ap2Items.length} / nextToken: {ap2NextToken ? "あり" : "なし"}
            </div>
          </div>
          <div style={{ padding: 10 }}>
            {ap2Items.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.8 }}>（結果なし）</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {ap2Items.map((r) => (
                  <li key={`${s((r as any).practiceCode)}|${s((r as any).abilityCode)}`}>
                    {String((r as any).abilityCode)} / score={String((r as any).score)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        ※ nextToken が「なし」になったら、それ以上のページはありません（=最後まで読み切り）。
      </div>
    </div>
  );
}