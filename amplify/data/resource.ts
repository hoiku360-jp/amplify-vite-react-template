import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // 既存：Todo（そのまま）
  Todo: a
    .model({
      content: a.string(),
      owner: a.string(), // owner列（作成者）
    })
    .authorization((allow) => [allow.ownerDefinedIn("owner")]),

  // 追加：投稿者
  Person: a
    .model({
      displayName: a.string().required(),
      organization: a.string(), // 任意
      owner: a.string().required(), // ←重要：Todoと同じ方式で縛るため

      // 1人が複数投稿
      boards: a.hasMany("Board", "authorId"),
    })
    .authorization((allow) => [allow.ownerDefinedIn("owner")]),

  // 追加：投稿（Board）
  Board: a
    .model({
      message: a.string().required(),
      authorId: a.id().required(), // Personのidを入れる
      author: a.belongsTo("Person", "authorId"),
      owner: a.string().required(), // ←Todoと同じ方式
    })
    .authorization((allow) => [allow.ownerDefinedIn("owner")]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
