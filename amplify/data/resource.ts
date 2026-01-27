import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      owner: a.string(), // owner列（作成者）を持たせる
    })
    .authorization((allow) => [
      // ログインユーザーだけが、自分のTodoだけCRUDできる
      allow.ownerDefinedIn("owner"),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
