import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

type Props = {
  owner: string;
  tenantId?: string;
  currentClassroomId?: string | null;
  allowedClassroomIds?: string[];
  isSchoolScope?: boolean;
};

type ModelError = {
  message?: string | null;
};

type ListOptions = Record<string, unknown>;
type MutationInput = Record<string, unknown>;

type ListResponse<TRow> = {
  data?: TRow[] | null;
  nextToken?: string | null;
  errors?: ModelError[] | null;
};

type MutationResponse<TRow> = {
  data?: TRow | null;
  errors?: ModelError[] | null;
};

type ListableModel<TRow> = {
  list(options?: ListOptions): Promise<ListResponse<TRow>>;
};

type CreatableModel<TRow> = {
  create(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type UpdatableModel<TRow> = {
  update(input: MutationInput): Promise<MutationResponse<TRow>>;
};

type ClassroomRow = Schema["Classroom"]["type"];
type AgeTargetRow = Schema["SchoolAnnualAgeTarget"]["type"];
type AttendanceSheetRow = Schema["AttendanceSheet"]["type"];
type AttendanceRecordRow = Schema["AttendanceRecord"]["type"];
type ParentNoticeReplyRow = Schema["ParentNoticeReply"]["type"];

type ClassroomDisplayRow = ClassroomRow & {
  name?: string | null;
  title?: string | null;
  className?: string | null;
};

type AgeTargetDisplayRow = AgeTargetRow & {
  ageBand?: string | number | null;
};

type AttendanceClient = {
  models: {
    Classroom: ListableModel<ClassroomRow>;
    SchoolAnnualAgeTarget: ListableModel<AgeTargetRow>;
    AttendanceSheet: ListableModel<AttendanceSheetRow> &
      CreatableModel<AttendanceSheetRow> &
      UpdatableModel<AttendanceSheetRow>;
    AttendanceRecord: ListableModel<AttendanceRecordRow> &
      CreatableModel<AttendanceRecordRow> &
      UpdatableModel<AttendanceRecordRow>;
    ParentNoticeReply: ListableModel<ParentNoticeReplyRow>;
  };
};

type DemoChild = {
  childKey: string;
  childName: string;
  sortOrder: number;
};

type RecordDraft = {
  arrivalTime: string;
  departureTime: string;
  memo: string;
};

const client = generateClient<Schema>() as unknown as AttendanceClient;

const DEFAULT_TENANT_ID = "demo-tenant";

const STANDARD_CARE_START = "07:00";
const STANDARD_CARE_END = "18:00";
const NURSERY_OPEN_START = "07:00";
const NURSERY_OPEN_END = "20:00";

const DEFAULT_CHILDREN: DemoChild[] = [
  { childKey: "sakura", childName: "さくら", sortOrder: 1 },
  { childKey: "tarou", childName: "たろう", sortOrder: 2 },
  { childKey: "mio", childName: "みお", sortOrder: 3 },
  { childKey: "yuuto", childName: "ゆうと", sortOrder: 4 },
  { childKey: "rin", childName: "りん", sortOrder: 5 },
];

const ASAGAO_CHILDREN: DemoChild[] = [
  { childKey: "aoi", childName: "あおい", sortOrder: 1 },
  { childKey: "haru", childName: "はる", sortOrder: 2 },
  { childKey: "koto", childName: "こと", sortOrder: 3 },
  { childKey: "souta", childName: "そうた", sortOrder: 4 },
  { childKey: "mei", childName: "めい", sortOrder: 5 },
];

const HIMAWARI_CHILDREN: DemoChild[] = [
  { childKey: "yui", childName: "ゆい", sortOrder: 1 },
  { childKey: "ren", childName: "れん", sortOrder: 2 },
  { childKey: "nana", childName: "なな", sortOrder: 3 },
  { childKey: "kai", childName: "かい", sortOrder: 4 },
  { childKey: "mana", childName: "まな", sortOrder: 5 },
];

const thStyle: CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#f6f8fa",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  verticalAlign: "top",
};

const smallMutedStyle: CSSProperties = {
  color: "#666",
  fontSize: 13,
};

function s(value: unknown): string {
  return String(value ?? "").trim();
}

function filterClassroomsForCurrentContext(
  rows: ClassroomRow[],
  tenantId: string,
  currentClassroomId: string | null,
  allowedClassroomIds: string[],
): ClassroomRow[] {
  const tenantRows = rows.filter((row) => s(row.tenantId) === tenantId);
  const currentId = s(currentClassroomId);
  if (currentId) {
    return tenantRows.filter((row) => row.id === currentId);
  }

  const allowedSet = new Set(allowedClassroomIds.map((value) => s(value)));
  if (allowedSet.size > 0) {
    return tenantRows.filter((row) => allowedSet.has(row.id));
  }

  return tenantRows;
}

function resolveNextClassroomId(
  rows: ClassroomRow[],
  currentClassroomId: string | null,
  selectedClassroomId: string,
): string {
  const currentId = currentClassroomId ?? "";
  if (currentId && rows.some((row) => row.id === currentId)) return currentId;
  if (
    selectedClassroomId &&
    rows.some((row) => row.id === selectedClassroomId)
  ) {
    return selectedClassroomId;
  }
  return rows[0]?.id ?? "";
}

function todayYYYYMMDD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function currentTimeHHMM() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function parseHHMMToMinutes(value: unknown): number | null {
  const text = s(value);
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatHHMMFromMinutes(value: number | null) {
  if (value === null) return "-";

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

function formatDurationMinutes(value: number) {
  const minutes = Math.max(0, Math.floor(value));

  if (minutes <= 0) return "0分";

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (hours <= 0) return `${restMinutes}分`;
  if (restMinutes <= 0) return `${hours}時間`;

  return `${hours}時間${restMinutes}分`;
}

function extensionCareInfo(departureTime: unknown) {
  const departureMinutes = parseHHMMToMinutes(departureTime);
  const standardEndMinutes = parseHHMMToMinutes(STANDARD_CARE_END) ?? 18 * 60;
  const nurseryCloseMinutes = parseHHMMToMinutes(NURSERY_OPEN_END) ?? 20 * 60;

  if (departureMinutes === null) {
    return {
      minutes: 0,
      label: "-",
      warning: "",
      exceedsOpenTime: false,
    };
  }

  const minutes = Math.max(0, departureMinutes - standardEndMinutes);
  const exceedsOpenTime = departureMinutes > nurseryCloseMinutes;

  return {
    minutes,
    label: formatDurationMinutes(minutes),
    warning: exceedsOpenTime
      ? `開園時間(${NURSERY_OPEN_END})を超過しています`
      : "",
    exceedsOpenTime,
  };
}

function formatModelErrors(
  errors?: ModelError[] | null,
  fallback = "Unknown error",
) {
  const messages = (errors ?? [])
    .map((e) => String(e.message ?? "").trim())
    .filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : fallback;
}

function assertMutationData<TRow>(
  res: MutationResponse<TRow>,
  fallback: string,
): TRow {
  if (res.errors?.length) {
    throw new Error(formatModelErrors(res.errors, fallback));
  }

  if (!res.data) {
    throw new Error(fallback);
  }

  return res.data;
}

async function listAll<TRow>(
  model: ListableModel<TRow>,
  args?: ListOptions,
): Promise<TRow[]> {
  const rows: TRow[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const res = await model.list({
      ...(args ?? {}),
      nextToken,
    });

    if (res.errors?.length) {
      throw new Error(formatModelErrors(res.errors, "list failed"));
    }

    if (Array.isArray(res.data)) {
      rows.push(...res.data);
    }

    nextToken = res.nextToken ?? null;
  } while (nextToken);

  return rows;
}

function classroomLabel(row: ClassroomDisplayRow) {
  return row.name || row.title || row.className || row.id;
}

function normalizeName(value: unknown) {
  return s(value)
    .replace(/\s+/g, "")
    .replace(/\u3000+/g, "");
}

function demoChildrenForClassroomName(classroomName: string): DemoChild[] {
  if (classroomName.includes("あさがお")) return ASAGAO_CHILDREN;
  if (classroomName.includes("ひまわり")) return HIMAWARI_CHILDREN;
  return DEFAULT_CHILDREN;
}

function deriveRecordStatus(draft: RecordDraft) {
  if (s(draft.departureTime)) return "DEPARTED";
  if (s(draft.arrivalTime)) return "ARRIVED";
  return "ISSUED";
}

function statusLabel(status?: string | null) {
  const v = s(status).toUpperCase();
  if (v === "DEPARTED") return "降園済";
  if (v === "ARRIVED") return "登園中";
  if (v === "ABSENT") return "欠席";
  if (v === "ISSUED") return "未登園";
  return status || "-";
}

function pickupLabel(reply?: ParentNoticeReplyRow | null) {
  if (!reply) return "-";

  const relation = s(reply.pickupPersonRelation);
  const name = s(reply.pickupPersonName);

  if (relation && name) return `${relation} ${name}`;
  return relation || name || "-";
}

function latestAttendanceSheetSort(
  a: AttendanceSheetRow,
  b: AttendanceSheetRow,
) {
  const versionDiff = Number(b.issueVersion ?? 0) - Number(a.issueVersion ?? 0);
  if (versionDiff !== 0) return versionDiff;

  return s(b.issuedAt).localeCompare(s(a.issuedAt));
}

function latestReplySort(a: ParentNoticeReplyRow, b: ParentNoticeReplyRow) {
  return s(b.submittedAt).localeCompare(s(a.submittedAt));
}

export default function AttendancePanel(props: Props) {
  const {
    owner,
    tenantId = DEFAULT_TENANT_ID,
    currentClassroomId = null,
    allowedClassroomIds = [],
    isSchoolScope = false,
  } = props;

  const [targetDate, setTargetDate] = useState(todayYYYYMMDD);
  const [classroomId, setClassroomId] = useState("");

  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [ageTargets, setAgeTargets] = useState<AgeTargetRow[]>([]);

  const [sheet, setSheet] = useState<AttendanceSheetRow | null>(null);
  const [records, setRecords] = useState<AttendanceRecordRow[]>([]);
  const [replies, setReplies] = useState<ParentNoticeReplyRow[]>([]);

  const [draftById, setDraftById] = useState<Record<string, RecordDraft>>({});

  const [loading, setLoading] = useState(false);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [savingRecordId, setSavingRecordId] = useState("");
  const [message, setMessage] = useState("");

  const selectedClassroom = useMemo(
    () => classrooms.find((row) => row.id === classroomId) ?? null,
    [classroomId, classrooms],
  );

  const selectedClassroomName = selectedClassroom
    ? classroomLabel(selectedClassroom as ClassroomDisplayRow)
    : "";

  const expectedChildren = useMemo(
    () => demoChildrenForClassroomName(selectedClassroomName),
    [selectedClassroomName],
  );

  const extensionSummary = useMemo(() => {
    let extendedCount = 0;
    let totalMinutes = 0;
    let overCloseCount = 0;
    let latestDepartureMinutes: number | null = null;

    for (const row of records) {
      const draft = draftById[row.id];
      const departureTime = draft?.departureTime ?? s(row.departureTime);

      const info = extensionCareInfo(departureTime);
      if (info.minutes > 0) {
        extendedCount += 1;
        totalMinutes += info.minutes;
      }

      if (info.exceedsOpenTime) {
        overCloseCount += 1;
      }

      const departureMinutes = parseHHMMToMinutes(departureTime);
      if (departureMinutes !== null) {
        latestDepartureMinutes =
          latestDepartureMinutes === null
            ? departureMinutes
            : Math.max(latestDepartureMinutes, departureMinutes);
      }
    }

    return {
      extendedCount,
      totalMinutes,
      overCloseCount,
      latestDepartureTime: formatHHMMFromMinutes(latestDepartureMinutes),
    };
  }, [draftById, records]);

  const sortedReplies = useMemo(
    () => [...replies].sort(latestReplySort),
    [replies],
  );

  function inferAgeTargetId() {
    const classroomAge = s(
      (selectedClassroom as { ageBand?: string })?.ageBand,
    );

    if (classroomAge) {
      const matched = ageTargets.find((row) => {
        const ageBand = s((row as AgeTargetDisplayRow).ageBand);
        return (
          ageBand === classroomAge ||
          `${ageBand}歳児` === classroomAge ||
          ageBand === classroomAge.replace("歳児", "")
        );
      });

      if (matched) return matched.id;
    }

    return ageTargets[0]?.id ?? "";
  }

  function replyForRecord(record: AttendanceRecordRow) {
    const key = s(record.childKey);
    const childName = normalizeName(record.childName);

    return sortedReplies.find((reply) => {
      const replyKey = s(reply.childKey);
      if (replyKey && replyKey === key) return true;

      const replyName = normalizeName(reply.childName);
      if (!replyName || !childName) return false;

      return (
        replyName === childName ||
        replyName.includes(childName) ||
        childName.includes(replyName)
      );
    });
  }

  function setDraft(recordId: string, patch: Partial<RecordDraft>) {
    setDraftById((prev) => {
      const current = prev[recordId] ?? {
        arrivalTime: "",
        departureTime: "",
        memo: "",
      };

      return {
        ...prev,
        [recordId]: {
          ...current,
          ...patch,
        },
      };
    });
  }

  const loadMaster = useCallback(async () => {
    const [classroomRows, ageTargetRows] = await Promise.all([
      listAll(client.models.Classroom, {
        filter: {
          tenantId: { eq: tenantId },
        },
        limit: 1000,
      }),
      listAll(client.models.SchoolAnnualAgeTarget, {
        filter: {
          tenantId: { eq: tenantId },
        },
        limit: 1000,
      }),
    ]);

    const nextClassrooms = filterClassroomsForCurrentContext(
      [...classroomRows].sort((a, b) =>
        classroomLabel(a as ClassroomDisplayRow).localeCompare(
          classroomLabel(b as ClassroomDisplayRow),
        ),
      ),
      tenantId,
      currentClassroomId,
      allowedClassroomIds,
    );

    setClassrooms(nextClassrooms);
    setAgeTargets(ageTargetRows);
    setClassroomId(
      resolveNextClassroomId(nextClassrooms, currentClassroomId, classroomId),
    );
  }, [allowedClassroomIds, classroomId, currentClassroomId, tenantId]);

  const loadAttendance = useCallback(async () => {
    const date = s(targetDate);
    const cls = s(classroomId);

    if (!date || !cls) return;

    setLoading(true);
    setMessage("");

    try {
      const [sheetRows, replyRows] = await Promise.all([
        listAll(client.models.AttendanceSheet, {
          filter: {
            tenantId: { eq: tenantId },
            classroomId: { eq: cls },
            targetDate: { eq: date },
          },
          limit: 100,
        }),
        listAll(client.models.ParentNoticeReply, {
          filter: {
            tenantId: { eq: tenantId },
            classroomId: { eq: cls },
            targetDate: { eq: date },
          },
          limit: 1000,
        }),
      ]);

      const latestSheet =
        sheetRows
          .filter((row) => s(row.status).toUpperCase() !== "ARCHIVED")
          .sort(latestAttendanceSheetSort)[0] ?? null;

      setReplies(
        replyRows.filter((row) => s(row.status).toUpperCase() !== "ARCHIVED"),
      );

      if (!latestSheet) {
        setSheet(null);
        setRecords([]);
        setDraftById({});
        setMessage(
          `登降園シートがありません。対象日=${date}, クラス=${selectedClassroomName || cls}`,
        );
        return;
      }

      setSheet(latestSheet);

      const recordRows = await listAll(client.models.AttendanceRecord, {
        filter: {
          tenantId: { eq: tenantId },
          attendanceSheetId: { eq: latestSheet.id },
        },
        limit: 1000,
      });

      const nextRecords = [...recordRows].sort(
        (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
      );

      setRecords(nextRecords);

      const nextDrafts: Record<string, RecordDraft> = {};
      for (const row of nextRecords) {
        nextDrafts[row.id] = {
          arrivalTime: s(row.arrivalTime),
          departureTime: s(row.departureTime),
          memo: s(row.memo),
        };
      }
      setDraftById(nextDrafts);

      setMessage(
        `登降園シートを読み込みました。対象日=${date}, 園児=${nextRecords.length}名, 保護者返信=${replyRows.length}件`,
      );
    } catch (e) {
      console.error(e);
      setMessage(
        `登降園シートの読込エラー: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
      setSheet(null);
      setRecords([]);
      setReplies([]);
      setDraftById({});
    } finally {
      setLoading(false);
    }
  }, [classroomId, selectedClassroomName, targetDate, tenantId]);

  useEffect(() => {
    void loadMaster();
  }, [loadMaster]);

  useEffect(() => {
    if (classroomId) {
      void loadAttendance();
    }
  }, [classroomId, loadAttendance]);

  async function createSheetManually() {
    const date = s(targetDate);
    const cls = s(classroomId);

    if (!date || !cls) {
      setMessage("対象日とクラスを選択してください。");
      return;
    }

    setCreatingSheet(true);
    setMessage("");

    try {
      const existing = await listAll(client.models.AttendanceSheet, {
        filter: {
          tenantId: { eq: tenantId },
          classroomId: { eq: cls },
          targetDate: { eq: date },
        },
        limit: 100,
      });

      const latestExisting =
        existing
          .filter((row) => s(row.status).toUpperCase() !== "ARCHIVED")
          .sort(latestAttendanceSheetSort)[0] ?? null;

      if (latestExisting) {
        setSheet(latestExisting);
        setMessage("既存の登降園シートが見つかりました。再読み込みします。");
        await loadAttendance();
        return;
      }

      const ageTargetId = inferAgeTargetId();
      const now = new Date().toISOString();

      const createdSheet = assertMutationData(
        await client.models.AttendanceSheet.create({
          tenantId,
          owner,
          classroomId: cls,
          ageTargetId: ageTargetId || undefined,
          targetDate: date,
          status: "ISSUED",
          issueType: "MANUAL",
          issueVersion: 1,
          issuedAt: now,
          memo: "登園・降園画面から手動発行しました。",
        }),
        "登降園シートの作成に失敗しました。",
      );

      for (const child of expectedChildren) {
        assertMutationData(
          await client.models.AttendanceRecord.create({
            tenantId,
            owner,
            attendanceSheetId: createdSheet.id,
            classroomId: cls,
            ageTargetId: ageTargetId || undefined,
            targetDate: date,
            childKey: child.childKey,
            childName: child.childName,
            sortOrder: child.sortOrder,
            status: "ISSUED",
          }),
          `登降園レコードの作成に失敗しました。childName=${child.childName}`,
        );
      }

      setMessage(
        `登降園シートを手動作成しました。対象日=${date}, 園児=${expectedChildren.length}名`,
      );

      await loadAttendance();
    } catch (e) {
      console.error(e);
      setMessage(
        `登降園シート作成エラー: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setCreatingSheet(false);
    }
  }

  async function saveRecordWithDraft(
    row: AttendanceRecordRow,
    draft: RecordDraft,
  ) {
    if (s(row.tenantId) !== tenantId) {
      setMessage(
        `この登降園レコードは現在の tenantId=${tenantId} に属していないため保存しません。`,
      );
      return;
    }

    setSavingRecordId(row.id);
    setMessage("");

    try {
      const now = new Date().toISOString();
      const nextStatus = deriveRecordStatus(draft);

      const updateRes = await client.models.AttendanceRecord.update({
        id: row.id,

        arrivalTime: s(draft.arrivalTime) || null,
        arrivalRecordedAt: s(draft.arrivalTime)
          ? row.arrivalRecordedAt || now
          : null,
        arrivalRecordedBySub: s(draft.arrivalTime)
          ? row.arrivalRecordedBySub || owner
          : null,

        departureTime: s(draft.departureTime) || null,
        departureRecordedAt: s(draft.departureTime)
          ? row.departureRecordedAt || now
          : null,
        departureRecordedBySub: s(draft.departureTime)
          ? row.departureRecordedBySub || owner
          : null,

        status: nextStatus,
        memo: s(draft.memo) || null,
      });

      const updated = assertMutationData(
        updateRes,
        "登降園レコードの保存に失敗しました。",
      );

      setRecords((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );

      if (sheet && s(sheet.status).toUpperCase() === "ISSUED") {
        const updatedSheet = await client.models.AttendanceSheet.update({
          id: sheet.id,
          status: "IN_PROGRESS",
          openedAt: sheet.openedAt || now,
        });

        if (!updatedSheet.errors?.length && updatedSheet.data) {
          setSheet(updatedSheet.data);
        }
      }

      setMessage(`${row.childName} の登降園記録を保存しました。`);
    } catch (e) {
      console.error(e);
      setMessage(`保存エラー: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingRecordId("");
    }
  }

  async function saveRecord(row: AttendanceRecordRow) {
    const draft = draftById[row.id] ?? {
      arrivalTime: s(row.arrivalTime),
      departureTime: s(row.departureTime),
      memo: s(row.memo),
    };

    await saveRecordWithDraft(row, draft);
  }

  async function setCurrentTimeAndSave(
    row: AttendanceRecordRow,
    field: "arrivalTime" | "departureTime",
  ) {
    const currentDraft = draftById[row.id] ?? {
      arrivalTime: s(row.arrivalTime),
      departureTime: s(row.departureTime),
      memo: s(row.memo),
    };

    const nextDraft = {
      ...currentDraft,
      [field]: currentTimeHHMM(),
    };

    setDraftById((prev) => ({
      ...prev,
      [row.id]: nextDraft,
    }));

    await saveRecordWithDraft(row, nextDraft);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>登園・降園</h2>
        <div style={smallMutedStyle}>
          日案とは別に、クラス・日付単位で登園時刻と降園時刻を記録します。
          保護者返信がある場合は、お迎え予定と家庭での様子を表示します。
        </div>
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#fff",
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "end",
          }}
        >
          <label>
            対象日{" "}
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </label>

          <label>
            クラス{" "}
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              disabled={
                !!currentClassroomId ||
                (!isSchoolScope && classrooms.length <= 1)
              }
            >
              <option value="">選択してください</option>
              {classrooms.map((row) => (
                <option key={row.id} value={row.id}>
                  {classroomLabel(row as ClassroomDisplayRow)}
                </option>
              ))}
            </select>
          </label>

          <button onClick={() => void loadAttendance()} disabled={loading}>
            {loading ? "読み込み中..." : "読み込み"}
          </button>

          <button
            onClick={() => void createSheetManually()}
            disabled={creatingSheet || loading || !classroomId}
          >
            {creatingSheet ? "作成中..." : "登降園シートを作成"}
          </button>
        </div>

        {message ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              background: "#f6fbff",
              border: "1px solid #dbeafe",
              borderRadius: 8,
              padding: 12,
            }}
          >
            {message}
          </pre>
        ) : null}

        <div style={smallMutedStyle}>
          選択中: {targetDate || "-"} / {selectedClassroomName || "-"} /{" "}
          {sheet
            ? `シート状態=${sheet.status}, v${sheet.issueVersion ?? "-"}`
            : "シート未発行"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 8,
          }}
        >
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div style={smallMutedStyle}>認定区分</div>
            <div style={{ fontWeight: 700 }}>保育標準時間認定</div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div style={smallMutedStyle}>通常保育時間</div>
            <div style={{ fontWeight: 700 }}>
              {STANDARD_CARE_START}-{STANDARD_CARE_END}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div style={smallMutedStyle}>開園時間</div>
            <div style={{ fontWeight: 700 }}>
              {NURSERY_OPEN_START}-{NURSERY_OPEN_END}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div style={smallMutedStyle}>延長保育対象</div>
            <div style={{ fontWeight: 700 }}>
              {extensionSummary.extendedCount}名
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              background: "#f9fafb",
            }}
          >
            <div style={smallMutedStyle}>延長保育合計</div>
            <div style={{ fontWeight: 700 }}>
              {formatDurationMinutes(extensionSummary.totalMinutes)}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              background:
                extensionSummary.overCloseCount > 0 ? "#fff7ed" : "#f9fafb",
            }}
          >
            <div style={smallMutedStyle}>最終降園</div>
            <div style={{ fontWeight: 700 }}>
              {extensionSummary.latestDepartureTime}
            </div>
            {extensionSummary.overCloseCount > 0 ? (
              <div style={{ color: "#c2410c", fontSize: 12 }}>
                開園時間超過: {extensionSummary.overCloseCount}名
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!sheet ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #fde68a",
            background: "#fffbeb",
            borderRadius: 8,
          }}
        >
          この日付・クラスの登降園シートはまだありません。自動発行前の確認や検証では、
          「登降園シートを作成」ボタンで手動作成してください。
        </div>
      ) : null}

      {sheet ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>登降園記録</h3>
            <div style={smallMutedStyle}>
              保護者返信は、同じ対象日・同じクラスの最新返信を園児名で突合しています。
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1350,
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>子ども</th>
                  <th style={thStyle}>家庭での様子</th>
                  <th style={thStyle}>登園時刻</th>
                  <th style={thStyle}>お迎え予定者</th>
                  <th style={thStyle}>お迎え予定時刻</th>
                  <th style={thStyle}>降園時刻</th>
                  <th style={thStyle}>認定区分</th>
                  <th style={thStyle}>通常保育</th>
                  <th style={thStyle}>延長保育</th>
                  <th style={thStyle}>メモ</th>
                  <th style={thStyle}>状態</th>
                  <th style={thStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => {
                  const reply = replyForRecord(row);
                  const draft = draftById[row.id] ?? {
                    arrivalTime: s(row.arrivalTime),
                    departureTime: s(row.departureTime),
                    memo: s(row.memo),
                  };

                  const extensionInfo = extensionCareInfo(draft.departureTime);

                  const saving = savingRecordId === row.id;

                  return (
                    <tr key={row.id}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700 }}>{row.childName}</div>
                        <div style={smallMutedStyle}>{row.childKey}</div>
                      </td>

                      <td style={tdStyle}>
                        {reply?.homeNote ? (
                          <div>{reply.homeNote}</div>
                        ) : (
                          <span style={smallMutedStyle}>返信なし</span>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "grid", gap: 6 }}>
                          <input
                            type="time"
                            value={draft.arrivalTime}
                            onChange={(e) =>
                              setDraft(row.id, {
                                arrivalTime: e.target.value,
                              })
                            }
                          />
                          <button
                            onClick={() =>
                              void setCurrentTimeAndSave(row, "arrivalTime")
                            }
                            disabled={saving}
                          >
                            現在時刻
                          </button>
                        </div>
                      </td>

                      <td style={tdStyle}>{pickupLabel(reply)}</td>

                      <td style={tdStyle}>{reply?.pickupPlannedTime || "-"}</td>

                      <td style={tdStyle}>
                        <div style={{ display: "grid", gap: 6 }}>
                          <input
                            type="time"
                            value={draft.departureTime}
                            onChange={(e) =>
                              setDraft(row.id, {
                                departureTime: e.target.value,
                              })
                            }
                          />
                          <button
                            onClick={() =>
                              void setCurrentTimeAndSave(row, "departureTime")
                            }
                            disabled={saving}
                          >
                            現在時刻
                          </button>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700 }}>標準時間</div>
                        <div style={smallMutedStyle}>
                          全園児を保育標準時間認定として扱います
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div>
                          {STANDARD_CARE_START}-{STANDARD_CARE_END}
                        </div>
                        <div style={smallMutedStyle}>
                          開園 {NURSERY_OPEN_START}-{NURSERY_OPEN_END}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            fontWeight:
                              extensionInfo.minutes > 0 ? 700 : undefined,
                            color: extensionInfo.exceedsOpenTime
                              ? "#c2410c"
                              : undefined,
                          }}
                        >
                          {extensionInfo.label}
                        </div>
                        {extensionInfo.warning ? (
                          <div style={{ color: "#c2410c", fontSize: 12 }}>
                            {extensionInfo.warning}
                          </div>
                        ) : null}
                      </td>

                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={draft.memo}
                          onChange={(e) =>
                            setDraft(row.id, {
                              memo: e.target.value,
                            })
                          }
                          placeholder="任意メモ"
                          style={{ width: "100%" }}
                        />
                      </td>

                      <td style={tdStyle}>{statusLabel(row.status)}</td>

                      <td style={tdStyle}>
                        <button
                          onClick={() => void saveRecord(row)}
                          disabled={saving}
                        >
                          {saving ? "保存中..." : "保存"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {records.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={12}>
                      登降園レコードがありません。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#f9fafb",
          color: "#555",
          fontSize: 13,
        }}
      >
        MVPメモ:
        さくら組・すみれ組は「さくら、たろう、みお、ゆうと、りん」を使用します。
        あさがお組・ひまわり組は別の固定5名を使用します。
      </div>
    </div>
  );
}
