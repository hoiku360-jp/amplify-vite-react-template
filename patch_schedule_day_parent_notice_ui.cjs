// patch_schedule_day_parent_notice_ui.cjs
// 保育360MVP Phase 2: ScheduleDayPanel.tsx に「保護者向けお知らせ」UIを追加するパッチです。
// 実行場所: プロジェクトルート
// 実行例:
//   node .\patch_schedule_day_parent_notice_ui.cjs

const fs = require("fs");
const path = require("path");

const target = path.join("src", "features", "schedule", "ScheduleDayPanel.tsx");

if (!fs.existsSync(target)) {
  throw new Error(`ScheduleDayPanel.tsx が見つかりません: ${target}`);
}

let text = fs.readFileSync(target, "utf8");

function addAfter(source, needle, insert, label) {
  if (source.includes(insert.trim())) {
    console.log(`SKIP: ${label} は既に追加済みです。`);
    return source;
  }
  if (!source.includes(needle)) {
    throw new Error(`挿入位置が見つかりません: ${label}`);
  }
  console.log(`ADD : ${label}`);
  return source.replace(needle, `${needle}\n${insert}`);
}

function replaceOnce(source, needle, replacement, label) {
  if (source.includes(replacement.trim())) {
    console.log(`SKIP: ${label} は既に追加済みです。`);
    return source;
  }
  if (!source.includes(needle)) {
    throw new Error(`置換位置が見つかりません: ${label}`);
  }
  console.log(`REPL: ${label}`);
  return source.replace(needle, replacement);
}

// 1) 型定義を追加
const needleTypes = [
  "type CleanupTranscriptResult = {",
  "  originalText?: string;",
  "  cleanedText?: string;",
  "  status?: string;",
  "  message?: string;",
  "};",
].join("\n");

const insertTypes = [
  "",
  "type GenerateParentNoticeArgs = {",
  "  scheduleDayId: string;",
  "  manualNote?: string | null;",
  "};",
  "",
  "type GenerateParentNoticeResult = {",
  "  scheduleDayId?: string | null;",
  "  draftText?: string | null;",
  "  sourceJson?: string | null;",
  "  status?: string | null;",
  "  message?: string | null;",
  "};",
].join("\n");

text = addAfter(text, needleTypes, insertTypes, "GenerateParentNotice types");

// 2) client.mutations に generateParentNotice を追加
const needleMutationType = [
  "    cleanupTranscriptText?: OperationRunner<",
  "      CleanupTranscriptArgs,",
  "      CleanupTranscriptResult",
  "    >;",
].join("\n");

const insertMutationType = [
  "    generateParentNotice?: OperationRunner<",
  "      GenerateParentNoticeArgs,",
  "      GenerateParentNoticeResult",
  "    >;",
].join("\n");

text = addAfter(
  text,
  needleMutationType,
  insertMutationType,
  "client.mutations.generateParentNotice",
);

// 3) state を追加
const needleState = '  const [message, setMessage] = useState("");';

const insertState = [
  "  const [generatingParentNotice, setGeneratingParentNotice] = useState(false);",
  "  const [savingParentNotice, setSavingParentNotice] = useState(false);",
  '  const [parentNoticeDraft, setParentNoticeDraft] = useState("");',
  '  const [parentNoticeManualNote, setParentNoticeManualNote] = useState("");',
].join("\n");

text = addAfter(text, needleState, insertState, "parent notice state");

// 4) loadScheduleDay のリセットを追加
const needleReset = [
  "    setCalendarEvents([]);",
  "    setMemoDrafts({});",
  "    setAttendanceDrafts({});",
  "    setTranscriptDrafts({});",
].join("\n");

const replacementReset = [
  "    setCalendarEvents([]);",
  "    setMemoDrafts({});",
  "    setAttendanceDrafts({});",
  "    setTranscriptDrafts({});",
  '    setParentNoticeDraft("");',
  '    setParentNoticeManualNote("");',
].join("\n");

text = replaceOnce(text, needleReset, replacementReset, "loadScheduleDay reset parent notice");

// 5) loadScheduleDay で既存お知らせを draft に反映
const needleAfterSetDay = "      setDay(normalizedDay);";

const insertAfterSetDay = [
  "      setParentNoticeDraft(",
  "        s(normalizedDay.parentNoticeText) || s(normalizedDay.parentNoticeDraftText),",
  "      );",
  '      setParentNoticeManualNote("");',
].join("\n");

text = addAfter(text, needleAfterSetDay, insertAfterSetDay, "load existing parent notice");

// 6) 操作関数を追加
const needleBeforeSaveMemo = "  async function saveMemo(item: ScheduleDayItemRow) {";

const insertFunctions = [
  "  async function generateParentNotice() {",
  "    if (!day) return;",
  "",
  "    const runner = client.mutations?.generateParentNotice;",
  "    if (!runner) {",
  '      setMessage("generateParentNotice mutation が見つかりません。resource.ts と sandbox を確認してください。");',
  "      return;",
  "    }",
  "",
  "    setGeneratingParentNotice(true);",
  '    setMessage("");',
  "",
  "    try {",
  "      let res:",
  "        | OperationEnvelope<GenerateParentNoticeResult>",
  "        | GenerateParentNoticeResult;",
  "",
  "      const args: GenerateParentNoticeArgs = {",
  "        scheduleDayId: day.id,",
  "        manualNote: parentNoticeManualNote.trim() || undefined,",
  "      };",
  "",
  "      try {",
  "        res = await runner(args);",
  "      } catch {",
  "        res = await runner({ input: args });",
  "      }",
  "",
  "      const errors = getOperationErrors(res);",
  "      if (errors?.length) {",
  "        throw new Error(formatModelErrors(errors, \"お知らせ案の生成に失敗しました。\"));",
  "      }",
  "",
  "      const data = getOperationData(res);",
  '      const draftText = s(data?.draftText);',
  "",
  "      if (!draftText) {",
  '        throw new Error("生成結果が空でした。");',
  "      }",
  "",
  "      setParentNoticeDraft(draftText);",
  "      setDay({",
  "        ...day,",
  "        parentNoticeDraftText: draftText,",
  "        parentNoticeText: draftText,",
  '        parentNoticeStatus: s(data?.status) || "DRAFT",',
  "        parentNoticeSourceJson: data?.sourceJson ?? day.parentNoticeSourceJson,",
  "        parentNoticeGeneratedAt: new Date().toISOString(),",
  "      });",
  "",
  "      setMessage(",
  '        data?.message',
  '          ? `保護者向けお知らせ案を生成しました。${data.message}`',
  '          : "保護者向けお知らせ案を生成しました。",',
  "      );",
  "    } catch (e) {",
  "      console.error(e);",
  "      setMessage(",
  '        `お知らせ案生成エラー: ${e instanceof Error ? e.message : String(e)}`,',
  "      );",
  "    } finally {",
  "      setGeneratingParentNotice(false);",
  "    }",
  "  }",
  "",
  "  async function saveParentNotice() {",
  "    if (!day) return;",
  "",
  "    setSavingParentNotice(true);",
  '    setMessage("");',
  "",
  "    try {",
  "      const text = parentNoticeDraft.trim();",
  "      const now = new Date().toISOString();",
  "",
  "      const updateRes = await client.models.ScheduleDay.update({",
  "        id: day.id,",
  "        parentNoticeText: text,",
  "        parentNoticeDraftText: text,",
  '        parentNoticeStatus: text ? "CONFIRMED" : "CLEARED",',
  "        parentNoticeConfirmedAt: now,",
  "      } as MutationInput);",
  "",
  "      if (!updateRes.data) {",
  "        throw new Error(",
  "          formatModelErrors(",
  "            updateRes.errors,",
  '            "保護者向けお知らせの保存に失敗しました。",',
  "          ),",
  "        );",
  "      }",
  "",
  "      setDay(updateRes.data);",
  '      setMessage(text ? "保護者向けお知らせを確定保存しました。" : "保護者向けお知らせをクリアしました。");',
  "    } catch (e) {",
  "      console.error(e);",
  "      setMessage(",
  '        `お知らせ保存エラー: ${e instanceof Error ? e.message : String(e)}`,',
  "      );",
  "    } finally {",
  "      setSavingParentNotice(false);",
  "    }",
  "  }",
  "",
  "  async function clearParentNotice() {",
  '    setParentNoticeDraft("");',
  '    setParentNoticeManualNote("");',
  "    await saveParentNotice();",
  "  }",
  "",
].join("\n");

text = addAfter(text, needleBeforeSaveMemo, insertFunctions, "parent notice functions");

// addAfter inserts after the needle, but for functions we want before saveMemo.
// Fix if it produced duplicate "async function saveMemo" before the inserted functions.
text = text.replace(
  "  async function saveMemo(item: ScheduleDayItemRow) {\n" + insertFunctions,
  insertFunctions + "  async function saveMemo(item: ScheduleDayItemRow) {",
);

// 7) JSX ブロックを追加
const needleCalendarBlock = [
  "      {day ? (",
  "        <ScheduleDayCalendarPanel",
  "          rows={calendarEvents}",
  "          targetDate={day.targetDate}",
  "        />",
  "      ) : null}",
  "",
  "      {day ? (",
].join("\n");

const replacementCalendarBlock = [
  "      {day ? (",
  "        <ScheduleDayCalendarPanel",
  "          rows={calendarEvents}",
  "          targetDate={day.targetDate}",
  "        />",
  "      ) : null}",
  "",
  "      {day ? (",
  "        <div",
  "          style={{",
  "            padding: 16,",
  '            border: "1px solid #d0d7de",',
  "            borderRadius: 8,",
  '            background: "#fffdf7",',
  '            display: "grid",',
  "            gap: 12,",
  "          }}",
  "        >",
  '          <h3 style={{ margin: 0 }}>保護者向けお知らせ</h3>',
  "",
  '          <div style={{ fontSize: 13, color: "#555" }}>',
  "            今日の予定・家庭への連絡事項・Practiceをもとに、保護者向けのお知らせ下書きを生成します。",
  "            送信機能ではなく、保育士が確認・編集して確定するための下書きです。",
  "          </div>",
  "",
  "          <label>",
  '            <div style={{ fontWeight: 700, marginBottom: 4 }}>手入力の補足</div>',
  "            <textarea",
  "              value={parentNoticeManualNote}",
  "              onChange={(e) => setParentNoticeManualNote(e.target.value)}",
  '              placeholder="例: 明日は水遊びです。水着、タオル、着替えをお持ちください。"',
  "              disabled={generatingParentNotice || savingParentNotice}",
  "              style={{",
  '                width: "100%",',
  "                minHeight: 64,",
  '                resize: "vertical",',
  "              }}",
  "            />",
  "          </label>",
  "",
  "          <div style={{ display: \"flex\", gap: 8, flexWrap: \"wrap\" }}>",
  "            <button",
  "              onClick={generateParentNotice}",
  "              disabled={generatingParentNotice || savingParentNotice}",
  "            >",
  '              {generatingParentNotice ? "生成中..." : "お知らせ案を生成"}',
  "            </button>",
  "",
  "            <button",
  "              onClick={saveParentNotice}",
  "              disabled={generatingParentNotice || savingParentNotice}",
  "            >",
  '              {savingParentNotice ? "保存中..." : "確定保存"}',
  "            </button>",
  "",
  "            <button",
  "              onClick={clearParentNotice}",
  "              disabled={generatingParentNotice || savingParentNotice}",
  "            >",
  "              クリア",
  "            </button>",
  "          </div>",
  "",
  "          <label>",
  '            <div style={{ fontWeight: 700, marginBottom: 4 }}>お知らせ本文</div>',
  "            <textarea",
  "              value={parentNoticeDraft}",
  "              onChange={(e) => setParentNoticeDraft(e.target.value)}",
  '              placeholder="ここに保護者向けお知らせ文を入力・編集します。"',
  "              disabled={generatingParentNotice || savingParentNotice}",
  "              style={{",
  '                width: "100%",',
  "                minHeight: 140,",
  '                resize: "vertical",',
  "                whiteSpace: \"pre-wrap\",",
  "              }}",
  "            />",
  "          </label>",
  "",
  '          <div style={{ fontSize: 12, color: "#666" }}>',
  "            status: {day.parentNoticeStatus || \"未作成\"} / generatedAt: {formatDateTime(day.parentNoticeGeneratedAt)} / confirmedAt: {formatDateTime(day.parentNoticeConfirmedAt)}",
  "          </div>",
  "        </div>",
  "      ) : null}",
  "",
  "      {day ? (",
].join("\n");

text = replaceOnce(
  text,
  needleCalendarBlock,
  replacementCalendarBlock,
  "parent notice JSX",
);

fs.writeFileSync(target, text, "utf8");

console.log("");
console.log(`完了: ${target} を更新しました。`);
console.log("次に実行してください:");
console.log("  npm run build");
