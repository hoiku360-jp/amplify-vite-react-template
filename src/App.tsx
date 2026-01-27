import { useEffect, useMemo, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

// ★同じファイル内で必ず configure（最強の切り分け）
try {
  Amplify.configure(outputs);
  console.log("[amplify] configured", outputs);
} catch (e) {
  console.error("[amplify] configure failed", e);
}

function TodosApp(props: { owner: string }) {
  const { owner } = props;

  // ★白画面回避：クライアント生成が失敗しても、画面にエラーを出す
  const [clientError, setClientError] = useState<string | null>(null);

  const client = useMemo(() => {
    try {
      return generateClient<Schema>();
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setClientError(msg);
      console.error("[amplify] generateClient failed", e);
      return null;
    }
  }, []);

  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    if (!client) return;

    const sub = client.models.Todo.observeQuery({
      filter: { owner: { eq: owner } },
    }).subscribe({
      next: (data) => setTodos([...data.items]),
    });

    return () => sub.unsubscribe();
  }, [client, owner]);

  function createTodo() {
    if (!client) return;
    client.models.Todo.create({
      content: window.prompt("Todo content") ?? "",
      owner,
    });
  }

  if (clientError) {
    return (
      <main style={{ padding: 16 }}>
        <h2>Todos client error</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{clientError}</pre>
        <p>
          Console(F12) の <b>[amplify]</b> ログも見てください。
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
    </main>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => {
        // ★owner制御は cognito:username に合わせる（emailではなく username）
        const owner = user?.username ?? "unknown-owner";

        return (
          <div>
            <div style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
              <div>Signed in as: {owner}</div>
              <button onClick={signOut}>Sign out</button>
            </div>
            <TodosApp owner={owner} />
          </div>
        );
      }}
    </Authenticator>
  );
}
