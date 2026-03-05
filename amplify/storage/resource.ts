// amplify/storage/resource.ts
import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "hoiku360Storage",
  access: (allow) => ({
    // ✅ 先頭に / を付けない（ルール）
    // ✅ {entity_id} はアップロード時に identityId に置換される
    "tenants/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
  }),
});
