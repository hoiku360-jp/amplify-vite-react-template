import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // phone: true, // ←後で体験したい時にON（ONにすると phoneNumber が必須扱いになります）
  },

  // サインアップ時に持たせたい属性
 userAttributes: {
  // Cognito標準属性 'name' は、ここでは fullname として指定します
  fullname: {
    required: false,
    mutable: true,
  },
  preferredUsername: {
    required: false,
    mutable: true,
  },

  "custom:organization": {
    dataType: "String",
    mutable: true,
  },
},

  // MFA：まずは TOTP（認証アプリ）をON
  multifactor: {
  mode: 'REQUIRED',
  totp: true,
},
});
