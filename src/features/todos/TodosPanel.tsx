import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

import TodoListItem from "../../ui-components/TodoListItem";

type Props = {
  owner: string;
};

type TodoRow = Schema["Todo"]["type"];

type ModelError = {
  message?: string | null;
};

type ListResponse<TRow> = {
  data?: TRow[] | null;
  errors?: ModelError[] | null;
};

type MutationResponse<TRow> = {
  data?: TRow | null;
  errors?: ModelError[] | null;
};

type TodoModelApi = {
  list(args?: Record<string, unknown>): Promise<ListResponse<TodoRow>>;
  create(input: Record<string, unknown>): Promise<MutationResponse<TodoRow>>;
  delete(input: { id: string }): Promise<MutationResponse<TodoRow>>;
};

type TodosPanelClient = {
  models: {
    Todo: TodoModelApi;
  };
};

export default function TodosPanel(props: Props) {
  const { owner } = props;

  const client = useMemo(
    () => generateClient<Schema>() as unknown as TodosPanelClient,
    [],
  );
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTodos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, errors } = await client.models.Todo.list({
        filter: { owner: { eq: owner } },
      });
      if (errors?.length) {
        console.error("Todo.list errors:", errors);
      }
      setTodos(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [client, owner]);

  useEffect(() => {
    void refreshTodos();
  }, [refreshTodos]);

  async function createTodo() {
    const content = window.prompt("Todo content") ?? "";
    if (!content.trim()) return;

    const res = await client.models.Todo.create({
      content: content.trim(),
      owner,
    });
    const created = res.data;

    if (created?.id) {
      setTodos((prev) => [created, ...prev]);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
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
        <button onClick={() => void refreshTodos()}>Refresh</button>
        {loading ? <span>Loading</span> : null}
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {todos.map((todo) => (
          <div key={todo.id} style={{ position: "relative" }}>
            <TodoListItem
              overrides={{
                "Todo content": {
                  children: todo.content,
                  fontSize: "16px",
                  lineHeight: "20px",
                },
                Due: { children: "", fontSize: "12px", lineHeight: "16px" },
              }}
            />
            <button
              onClick={() => void deleteTodo(todo.id)}
              style={{ marginTop: 8 }}
            >
              delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
