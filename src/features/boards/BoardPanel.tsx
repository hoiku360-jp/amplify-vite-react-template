import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

import BoardCard from "../../ui-components/BoardCard";

export default function BoardPanel(props: { owner: string }) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [person, setPerson] = useState<Schema["Person"]["type"] | null>(null);
  const [boards, setBoards] = useState<Array<Schema["Board"]["type"]>>([]);
  const [loading, setLoading] = useState(false);

  async function ensureMyPerson(): Promise<Schema["Person"]["type"]> {
    const { data, errors } = await client.models.Person.list({
      filter: { owner: { eq: owner } },
    });
    if (errors?.length) console.error("Person.list errors:", errors);

    if ((data ?? []).length > 0) return (data ?? [])[0];

    const displayName =
      (window.prompt("あなたの表示名（Person.displayName）") ?? "").trim() || owner;
    const organization = (window.prompt("所属（任意）") ?? "").trim();

    const res = await client.models.Person.create({
      displayName,
      organization: organization || undefined,
      owner,
    });

    const created = (res as any)?.data;
    if (!created?.id) throw new Error("Person creation failed");
    return created;
  }

  async function refreshBoards() {
    setLoading(true);
    try {
      const { data, errors } = await client.models.Board.list({
        filter: { owner: { eq: owner } },
      });
      if (errors?.length) console.error("Board.list errors:", errors);
      setBoards(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const p = await ensureMyPerson();
        if (cancelled) return;
        setPerson(p);

        await refreshBoards();
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  async function createBoard() {
    if (!person?.id) return;

    const message = (window.prompt("投稿メッセージ（Board.message）") ?? "").trim();
    if (!message) return;

    const res = await client.models.Board.create({
      message,
      authorId: person.id,
      owner,
    });

    const created = (res as any)?.data;
    if (created?.id) setBoards((prev) => [created, ...prev]);

    await new Promise((r) => setTimeout(r, 300));
    await refreshBoards();
  }

  async function deleteBoard(id: string) {
    await client.models.Board.delete({ id });
    await refreshBoards();
  }

  return (
    <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2>Board（投稿）</h2>
      <div>Board count: {boards.length}</div>

      <div style={{ marginBottom: 8 }}>
        <b>Person（投稿者）:</b>{" "}
        {person ? `${person.displayName}${person.organization ? ` / ${person.organization}` : ""}` : "作成中"}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={createBoard} disabled={!person?.id}>
          + new post
        </button>
        <button onClick={refreshBoards}>
          Refresh
        </button>
        {loading ? <span>Loading</span> : null}
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {boards.map((b) => (
          <div key={b.id} style={{ position: "relative" }}>
            <BoardCard
              overrides={{
                // ★ BoardCard 側の要素名に合わせて調整が必要な場合あり
                "Board title": { children: b.message, fontSize: "16px", lineHeight: "20px" },
                "Board description": { children: "", fontSize: "14px", lineHeight: "18px" },
                "Updated at": { children: "", fontSize: "12px", lineHeight: "16px" },
              }}
            />
            <button onClick={() => deleteBoard(b.id)} style={{ marginTop: 8 }}>
              delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
