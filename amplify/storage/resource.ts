// amplify/storage/resource.ts
import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "hoiku360Storage",
  access: (allow) => ({
    // 既存: identity ごとの専用領域
    "tenants/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
    ],

    // Practice登録UI v1 用:
    // practice-audio/{tenantId}/{owner}/{practiceCode}/{fileName}
    "practice-audio/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});