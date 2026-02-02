import { useEffect, useMemo, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

// configure は最初に実行
Amplify.configure(outputs);

function TodosPanel(props: { owner: string }) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [loading, setLoading] = useState(false);

  async function refreshTodos() {
    setLoading(true);
    try {
      const { data } = await client.models.Todo.list({
        filter: { owner: { eq: owner } },
      });
      setTodos([...data]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  async function createTodo() {
    const content = window.prompt("Todo content") ?? "";
    if (!content.trim()) return;

    const res = await client.models.Todo.create({ content, owner });
    const created = (res as any)?.data;
    if (created?.id) setTodos((prev) => [created, ...prev]);

    await new Promise((r) => setTimeout(r, 300));
    await refreshTodos();
  }

  async function deleteTodo(id: string) {
    await client.models.Todo.delete({ id });
    await refreshTodos();
  }

  return (
    <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2>My todos Hoiku360</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={createTodo}>+ new</button>
        <button onClick={refreshTodos}>Refresh</button>
        {loading ? <span>Loading...</span> : null}
      </div>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>{todo.content}</span>
            <button onClick={() => deleteTodo(todo.id)}>delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BoardPanel(props: { owner: string }) {
  const { owner } = props;
  const client = useMemo(() => generateClient<Schema>(), []);

  const [person, setPerson] = useState<Schema["Person"]["type"] | null>(null);
  const [boards, setBoards] = useState<Array<Schema["Board"]["type"]>>([]);
  const [loading, setLoading] = useState(false);

  async function ensureMyPerson(): Promise<Schema["Person"]["type"]> {
    // 自分のPersonが既にあるか探す（ownerで1件にする想定）
    const { data } = await client.models.Person.list({
      filter: { owner: { eq: owner } },
    });

    if (data.length > 0) return data[0];

    // なければ作る（表示名はとりあえず入力）
    const displayName = (window.prompt("あなたの表示名（Person.displayName）") ?? "").trim() || owner;
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

  async function refreshBoards(authorId: string) {
    setLoading(true);
    try {
      // Boardは owner で絞る（自分の投稿のみ）
      const { data } = await client.models.Board.list({
        filter: { owner: { eq: owner } },
        // author情報も一緒に取りたい場合は selectionSet を使う（後で拡張）
        // selectionSet: ["id", "message", "authorId", "author.*"],
      });

      // authorIdでソートしたい等は必要なら後で
      setBoards([...data]);
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
        await refreshBoards(p.id);
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

    const message = window.prompt("投稿メッセージ（Board.message）") ?? "";
    if (!message.trim()) return;

    await client.models.Board.create({
      message: message.trim(),
      authorId: person.id,
      owner,
    });

    await new Promise((r) => setTimeout(r, 300));
    await refreshBoards(person.id);
  }

  async function deleteBoard(id: string) {
    await client.models.Board.delete({ id });
    if (person?.id) await refreshBoards(person.id);
  }

  return (
    <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2>Board（投稿）</h2>

      <div style={{ marginBottom: 8 }}>
        <b>Person（投稿者）:</b>{" "}
        {person ? `${person.displayName}${person.organization ? ` / ${person.organization}` : ""}` : "作成中..."}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={createBoard} disabled={!person?.id}>+ new post</button>
        <button onClick={() => person?.id && refreshBoards(person.id)} disabled={!person?.id}>Refresh</button>
        {loading ? <span>Loading...</span> : null}
      </div>

      <ul>
        {boards.map((b) => (
          <li key={b.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>{b.message}</span>
            <button onClick={() => deleteBoard(b.id)}>delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SignedInApp(props: { owner: string; signOut: () => void }) {
  const { owner, signOut } = props;

  return (
    <div>
      <div style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div>Signed in as: {owner}</div>
        <button onClick={signOut}>Sign out</button>
      </div>

      <div style={{ display: "grid", gap: 16, padding: 16 }}>
        <TodosPanel owner={owner} />
        <BoardPanel owner={owner} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        const owner = user?.username ?? "unknown-owner";
        return <SignedInApp owner={owner} signOut={signOut} />;
      }}
    </Authenticator>
  );
}
