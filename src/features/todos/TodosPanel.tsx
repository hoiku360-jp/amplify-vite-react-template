import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

import TodoListItem from "../../ui-components/TodoListItem";

export default function TodosPanel(props: { owner: string }) {
  const { owner } = props;

  const client = useMemo(() => generateClient<Schema>(), []);
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [loading, setLoading] = useState(false);

  async function refreshTodos() {
    setLoading(true);
    try {
      const { data, errors } = await client.models.Todo.list({
        filter: { owner: { eq: owner } },
      });
      if (errors?.length) console.error("Todo.list errors:", errors);
      setTodos(data ?? []);
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

    const res = await client.models.Todo.create({ content: content.trim(), owner });
    const created = (res as any)?.data;

    // ✅ 即時反映（配列の展開が必要）
    if (created?.id) setTodos((prev) => [created, ...prev]);

    // 念のため再取得（反映遅延対策）
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
      <div>Todo count: {todos.length}</div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={createTodo}>+ new</button>
        <button onClick={refreshTodos}>Refresh</button>
        {loading ? <span>Loading</span> : null}
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {todos.map((todo) => (
          <div key={todo.id} style={{ position: "relative" }}>
            <TodoListItem
              overrides={{
                "Todo content": { children: todo.content, fontSize: "16px", lineHeight: "20px" },
                "Due": { children: "", fontSize: "12px", lineHeight: "16px" },
              }}
            />
            <button onClick={() => deleteTodo(todo.id)} style={{ marginTop: 8 }}>
              delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
