// amplify/auth/resource.ts
import { defineAuth } from "@aws-amplify/backend";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },

  // ✅ MFA を復活（TOTP を必須）
  multifactor: {
    mode: "REQUIRED",
    totp: true,
  },
});
