// patch_backend_generate_parent_notice_bedrock_policy.cjs
// 保育360MVP Phase 2: generate-parent-notice Lambda に Bedrock InvokeModel 権限を付与します。
// 実行場所: プロジェクトルート
// 実行例:
//   node .\patch_backend_generate_parent_notice_bedrock_policy.cjs

const fs = require("fs");
const path = require("path");

const target = path.join("amplify", "backend.ts");

if (!fs.existsSync(target)) {
  throw new Error(`backend.ts が見つかりません: ${target}`);
}

let text = fs.readFileSync(target, "utf8");

function addIamImport(source) {
  if (/from\s+["']aws-cdk-lib\/aws-iam["']/.test(source)) {
    if (/import\s+\*\s+as\s+iam\s+from\s+["']aws-cdk-lib\/aws-iam["']/.test(source)) {
      console.log("SKIP: iam namespace import は既にあります。");
      return source;
    }

    const namedImportRegex =
      /import\s+\{([^}]*)\}\s+from\s+["']aws-cdk-lib\/aws-iam["'];?/;

    if (namedImportRegex.test(source)) {
      return source.replace(namedImportRegex, (match, imports) => {
        const names = imports
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

        let changed = false;
        for (const name of ["Effect", "PolicyStatement"]) {
          if (!names.includes(name)) {
            names.push(name);
            changed = true;
          }
        }

        if (changed) {
          console.log("ADD : aws-cdk-lib/aws-iam named imports");
        } else {
          console.log("SKIP: Effect / PolicyStatement imports は既にあります。");
        }

        return `import { ${names.join(", ")} } from "aws-cdk-lib/aws-iam";`;
      });
    }

    // 既存 import の形が想定外の場合は namespace import を追加
    console.log("ADD : iam namespace import");
    return source.replace(
      /(import\s+\{[^}]*defineBackend[^}]*\}\s+from\s+["']@aws-amplify\/backend["'];?\s*)/,
      `$1\nimport * as iam from "aws-cdk-lib/aws-iam";\n`,
    );
  }

  console.log("ADD : iam namespace import");
  if (/(import\s+\{[^}]*defineBackend[^}]*\}\s+from\s+["']@aws-amplify\/backend["'];?\s*)/.test(source)) {
    return source.replace(
      /(import\s+\{[^}]*defineBackend[^}]*\}\s+from\s+["']@aws-amplify\/backend["'];?\s*)/,
      `$1\nimport * as iam from "aws-cdk-lib/aws-iam";\n`,
    );
  }

  return `import * as iam from "aws-cdk-lib/aws-iam";\n${source}`;
}

function detectIamStyle(source) {
  if (/import\s+\*\s+as\s+iam\s+from\s+["']aws-cdk-lib\/aws-iam["']/.test(source)) {
    return {
      effectAllow: "iam.Effect.ALLOW",
      policyStatement: "iam.PolicyStatement",
    };
  }

  if (/import\s+\{([^}]*)\}\s+from\s+["']aws-cdk-lib\/aws-iam["']/.test(source)) {
    return {
      effectAllow: "Effect.ALLOW",
      policyStatement: "PolicyStatement",
    };
  }

  return {
    effectAllow: "iam.Effect.ALLOW",
    policyStatement: "iam.PolicyStatement",
  };
}

function addGenerateParentNoticeImport(source) {
  const importRegex = /import\s+\{([^}]*)\}\s+from\s+["']\.\/data\/resource["'];?/;

  if (!importRegex.test(source)) {
    throw new Error('import { data } from "./data/resource"; が見つかりません。backend.ts を確認してください。');
  }

  return source.replace(importRegex, (match, imports) => {
    const names = imports
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (names.includes("generateParentNoticeFn")) {
      console.log("SKIP: generateParentNoticeFn import は既にあります。");
      return match;
    }

    names.push("generateParentNoticeFn");
    console.log("ADD : generateParentNoticeFn import");
    return `import { ${names.join(", ")} } from "./data/resource";`;
  });
}

function addGenerateParentNoticeToBackend(source) {
  if (/defineBackend\s*\(\s*\{[\s\S]*?\bgenerateParentNoticeFn\b[\s\S]*?\}\s*\)/.test(source)) {
    console.log("SKIP: defineBackend に generateParentNoticeFn は既にあります。");
    return source;
  }

  const defineRegex = /(defineBackend\s*\(\s*\{[\s\S]*?\bdata\s*,)/;

  if (!defineRegex.test(source)) {
    throw new Error("defineBackend({ ... data, ... }) が見つかりません。backend.ts を確認してください。");
  }

  console.log("ADD : generateParentNoticeFn to defineBackend");
  return source.replace(defineRegex, `$1\n  generateParentNoticeFn,`);
}

function getBackendVarName(source) {
  const match = source.match(/(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*defineBackend\s*\(/);
  if (!match) {
    throw new Error("const backend = defineBackend(...) が見つかりません。backend.ts を確認してください。");
  }
  return match[1];
}

function addPolicy(source) {
  if (source.includes("generateParentNoticeBedrockPolicy")) {
    console.log("SKIP: generateParentNoticeBedrockPolicy は既に追加済みです。");
    return source;
  }

  const backendVar = getBackendVarName(source);
  const style = detectIamStyle(source);

  const block = `

const generateParentNoticeBedrockPolicy = new ${style.policyStatement}({
  effect: ${style.effectAllow},
  actions: ["bedrock:InvokeModel", "bedrock:GetInferenceProfile"],
  resources: [
    "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
    "arn:aws:bedrock:*:*:inference-profile/apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
  ],
});

${backendVar}.generateParentNoticeFn.resources.lambda.addToRolePolicy(
  generateParentNoticeBedrockPolicy,
);
`;

  // defineBackend(...) の直後に追加する
  const start = source.indexOf("defineBackend(");
  if (start < 0) {
    throw new Error("defineBackend(...) が見つかりません。");
  }

  let parenDepth = 0;
  let endIndex = -1;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];

    if (ch === "(") parenDepth += 1;
    if (ch === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) {
        let j = i + 1;
        while (j < source.length && /\s/.test(source[j])) j += 1;
        if (source[j] === ";") j += 1;
        endIndex = j;
        break;
      }
    }
  }

  if (endIndex < 0) {
    throw new Error("defineBackend(...) の終端を見つけられませんでした。");
  }

  console.log("ADD : generateParentNoticeFn Bedrock IAM policy");
  return `${source.slice(0, endIndex)}${block}${source.slice(endIndex)}`;
}

text = addIamImport(text);
text = addGenerateParentNoticeImport(text);
text = addGenerateParentNoticeToBackend(text);
text = addPolicy(text);

fs.writeFileSync(target, text, "utf8");

console.log("");
console.log(`完了: ${target} を更新しました。`);
console.log("次に実行してください:");
console.log("  git diff amplify/backend.ts");
console.log("  npm run build");
