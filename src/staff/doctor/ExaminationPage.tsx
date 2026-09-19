import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  History,
  Loader2,
  Pill,
  Play,
  Save,
  Trash2,
} from "lucide-react";
import {
  apiCompleteExamination,
  apiDeletePrescription,
  apiGetDoctorSchedule,
  apiGetMedicalRecord,
  apiGetPatientHistory,
  apiSaveMedicalRecord,
  apiSearchPrescribableMedicines,
  apiStartExamination,
  apiWritePrescription,
} from "../../api/functions/doctorWork";
import type { AppointmentListItem } from "../../api/types";
import type {
  MedicalRecord,
  MedicalRecordPayload,
  PrescribableMedicine,
  Prescription,
} from "../../api/staffTypes";
import { useAction, useApiQuery, useDebounced } from "../hooks";
import {
  formatDate,
  formatMoney,
  formatTime,
  nullIfBlank,
  todayIso,
} from "../format";
import { APPOINTMENT_STATUS, labelOf, PRESCRIPTION_STATUS } from "../labels";
import { useToast } from "../components/toastContext";
import useAuth from "../../hooks/useAuth";
import { PERMISSION } from "../permissions";
import { FollowUpSheet } from "./FollowUpSheet";
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatusBadge,
  Steps,
} from "../components/ui";

/* ---------------------------------------------------------------- Record form */

const RECORD_FIELDS = [
  "symptoms",
  "examination_findings",
  "diagnosis",
  "icd10_code",
  "treatment_plan",
  "follow_up_date",
  "follow_up_notes",
  "doctor_notes",
] as const;

type RecordForm = Record<(typeof RECORD_FIELDS)[number], string>;

const emptyRecord: RecordForm = Object.fromEntries(
  RECORD_FIELDS.map((key) => [key, ""]),
) as RecordForm;

const toRecordForm = (record: MedicalRecord): RecordForm =>
  Object.fromEntries(
    RECORD_FIELDS.map((key) => [key, record[key] ?? ""]),
  ) as RecordForm;

const toRecordPayload = (form: RecordForm): MedicalRecordPayload => ({
  symptoms: nullIfBlank(form.symptoms),
  examination_findings: nullIfBlank(form.examination_findings),
  diagnosis: form.diagnosis.trim(),
  icd10_code: nullIfBlank(form.icd10_code),
  treatment_plan: nullIfBlank(form.treatment_plan),
  follow_up_date: nullIfBlank(form.follow_up_date),
  follow_up_notes: nullIfBlank(form.follow_up_notes),
  doctor_notes: nullIfBlank(form.doctor_notes),
});

/* ---------------------------------------------------------------- Prescription lines */

interface Line {
  key: number;
  medicine: Pick<
    PrescribableMedicine,
    "medicine_id" | "medicine_name" | "unit_of_measure" | "unit_price"
  > & {
    available_stock?: number;
  };
  quantity: string;
  dosage: string;
  frequency: string;
  duration_days: string;
  usage_instructions: string;
}

let lineKey = 1;

const linesFromPrescription = (prescription: Prescription | null): Line[] =>
  (prescription?.items ?? []).map((item) => ({
    key: lineKey++,
    medicine: {
      medicine_id: item.medicine_id,
      medicine_name: item.medicine_name,
      unit_of_measure: item.unit_of_measure,
      unit_price: item.unit_price,
    },
    quantity: String(item.quantity_prescribed),
    dosage: item.dosage,
    frequency: item.frequency,
    duration_days: item.duration_days ? String(item.duration_days) : "",
    usage_instructions: item.usage_instructions ?? "",
  }));

const MedicineSearch = ({
  onPick,
  disabled,
}: {
  onPick: (medicine: PrescribableMedicine) => void;
  disabled?: boolean;
}) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const search = useDebounced(text.trim(), 250);
  const ref = useRef<HTMLDivElement>(null);
  const query = useApiQuery(
    () => apiSearchPrescribableMedicines({ search, page_size: 10 }),
    [search],
    {
      enabled: open && search.length >= 1,
    },
  );

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="st-picker" ref={ref}>
      <Field label="Thêm thuốc">
        {(id) => (
          <input
            id={id}
            className="st-input"
            placeholder="Gõ tên thuốc hoặc hoạt chất…"
            value={text}
            disabled={disabled}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setText(event.target.value);
              setOpen(true);
            }}
          />
        )}
      </Field>
      {open && search.length >= 1 && (
        <div className="st-picker-list" role="listbox">
          {query.loading && (
            <div className="st-picker-option st-muted">
              <Loader2 size={14} className="st-spin" /> Đang tìm…
            </div>
          )}
          {!query.loading && (query.data?.items ?? []).length === 0 && (
            <div className="st-picker-option st-muted">
              Không tìm thấy thuốc.
            </div>
          )}
          {(query.data?.items ?? []).map((medicine) => (
            <button
              key={medicine.medicine_id}
              type="button"
              role="option"
              aria-selected={false}
              className="st-picker-option"
              onClick={() => {
                onPick(medicine);
                setText("");
                setOpen(false);
              }}
            >
              <span>
                <span className="st-cell-main">{medicine.medicine_name}</span>
                <br />
                <span className="st-cell-sub">
                  {medicine.active_ingredient ?? "—"} ·{" "}
                  {formatMoney(medicine.unit_price)}/{medicine.unit_of_measure}
                </span>
              </span>
              <span
                className="st-cell-sub st-nowrap"
                style={{
                  color:
                    medicine.available_stock > 0
                      ? undefined
                      : "var(--st-danger)",
                }}
              >
                Còn {medicine.available_stock}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------- Page */

const ExaminationPage = () => {
  const appointmentId = Number(useParams().appointmentId);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { run, isPending, pending } = useAction();
  const { hasPermission } = useAuth();
  const canFollowUp = hasPermission(PERMISSION.AppointmentsBookFollowUp);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpBooked, setFollowUpBooked] = useState<string | null>(null);

  const [appointment, setAppointment] = useState<AppointmentListItem | null>(
    (location.state as { appointment?: AppointmentListItem } | null)
      ?.appointment ?? null,
  );
  const [recordForm, setRecordForm] = useState<RecordForm>(emptyRecord);
  const [recordDirty, setRecordDirty] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [rxNotes, setRxNotes] = useState("");
  const [rxDirty, setRxDirty] = useState(false);
  const [confirm, setConfirm] = useState<"complete" | "delete-rx" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [initialStepSet, setInitialStepSet] = useState(false);

  // Bác sĩ không có API đọc một lịch hẹn; mở thẳng URL thì tìm lại trong lịch của chính mình.
  useEffect(() => {
    if (appointment?.appointment_id === appointmentId) {
      return;
    }
    let alive = true;
    apiGetDoctorSchedule({
      from_date: todayIso(-60),
      to_date: todayIso(30),
      page_size: 100,
    }).then((result) => {
      const found = result.data?.items.find(
        (item) => item.appointment_id === appointmentId,
      );
      if (alive && found) {
        setAppointment(found);
      }
    });
    return () => {
      alive = false;
    };
  }, [appointmentId, appointment]);

  const record = useApiQuery(
    () => apiGetMedicalRecord(appointmentId),
    [appointmentId],
  );
  const hasRecord = Boolean(record.data);

  // Nạp form từ dữ liệu server ngay trong lượt render, tách riêng bệnh án và đơn thuốc: lưu
  // đơn thuốc không được xoá những gì bác sĩ đang gõ dở trong bệnh án, và ngược lại.
  const recordStamp = record.data
    ? `${record.data.medical_record_id}:${record.data.updated_at}`
    : null;
  const rxStamp = record.data ? JSON.stringify(record.data.prescription) : null;
  const [seenRecord, setSeenRecord] = useState<string | null>(null);
  const [seenRx, setSeenRx] = useState<string | null>(null);

  if (record.data && rxStamp !== seenRx) {
    setSeenRx(rxStamp);
    setLines(linesFromPrescription(record.data.prescription));
    setRxNotes(record.data.prescription?.notes ?? "");
    setRxDirty(false);
  }

  if (record.data && recordStamp !== seenRecord) {
    setSeenRecord(recordStamp);
    setRecordForm(toRecordForm(record.data));
    setRecordDirty(false);
    if (!appointment) {
      setAppointment(
        (current) =>
          current ??
          ({
            appointment_id: record.data!.appointment_id,
            patient_id: record.data!.patient_id,
            patient_full_name: record.data!.patient_full_name,
            doctor_id: record.data!.doctor_id,
            doctor_full_name: record.data!.doctor_full_name,
            appointment_date: record.data!.appointment_date,
            appointment_time: record.data!.appointment_time,
            duration_minutes: 0,
            // Không đoán trạng thái: để trống thì trang chỉ cho xem, không mở thao tác nào.
            status: "",
            consultation_mode: "in_clinic",
            queue_number: null,
            discount_percent: 0,
            created_at: record.data!.created_at,
          } satisfies AppointmentListItem),
      );
    }
  }

  const patientId = appointment?.patient_id ?? record.data?.patient_id ?? null;
  const history = useApiQuery(
    () => apiGetPatientHistory(patientId!, { page_size: 10 }),
    [patientId],
    {
      enabled: Boolean(patientId),
    },
  );

  const status = appointment?.status ?? null;
  const inProgress = status === "in_progress";

  // Chọn bước mở đầu một lần, khi đã biết trạng thái lượt khám và có/không có bệnh án.
  if (!initialStepSet && status && !record.loading) {
    setInitialStepSet(true);
    setStep(status === "completed" ? 2 : inProgress && record.data ? 1 : 0);
  }

  const goTo = (next: 0 | 1 | 2) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prescription = record.data?.prescription ?? null;
  const rxEditable =
    inProgress &&
    hasRecord &&
    (!prescription || prescription.status === "pending");

  const setStatus = (next: string) =>
    setAppointment((current) =>
      current ? { ...current, status: next } : current,
    );

  const start = async () => {
    const result = await run("start", () => apiStartExamination(appointmentId));
    if (result.ok && result.data) {
      setStatus(result.data.status);
      toast.success("Đã bắt đầu khám.");
    } else {
      toast.error(result.error);
    }
  };

  const saveRecord = async () => {
    if (!recordForm.diagnosis.trim()) {
      setFormError("Chẩn đoán là bắt buộc.");
      return;
    }
    setFormError(null);
    const result = await run("record", () =>
      apiSaveMedicalRecord(appointmentId, toRecordPayload(recordForm)),
    );
    if (result.ok && result.data) {
      record.setData(result.data);
      toast.success("Đã lưu bệnh án. Tiếp tục kê đơn thuốc.");
      goTo(1);
    } else {
      setFormError(result.error);
    }
  };

  const saveRx = async () => {
    const invalid = lines.find(
      (line) =>
        !(Number(line.quantity) > 0) ||
        !line.dosage.trim() ||
        !line.frequency.trim(),
    );
    if (lines.length === 0) {
      setFormError(
        "Đơn thuốc cần ít nhất một thuốc. Nếu không kê đơn, hãy xoá đơn.",
      );
      return;
    }
    if (invalid) {
      setFormError(
        `Nhập đủ số lượng, liều dùng và tần suất cho ${invalid.medicine.medicine_name}.`,
      );
      return;
    }
    setFormError(null);
    const result = await run("rx", () =>
      apiWritePrescription(appointmentId, {
        notes: nullIfBlank(rxNotes),
        items: lines.map((line) => ({
          medicine_id: line.medicine.medicine_id,
          quantity: Number(line.quantity),
          dosage: line.dosage.trim(),
          frequency: line.frequency.trim(),
          duration_days: line.duration_days ? Number(line.duration_days) : null,
          usage_instructions: nullIfBlank(line.usage_instructions),
        })),
      }),
    );
    if (result.ok && result.data) {
      record.setData((current) =>
        current ? { ...current, prescription: result.data } : current,
      );
      toast.success("Đã lưu đơn thuốc.");
    } else {
      setFormError(result.error);
    }
  };

  const deleteRx = async () => {
    const result = await run("delete-rx", () =>
      apiDeletePrescription(appointmentId),
    );
    setConfirm(null);
    if (result.ok) {
      record.setData((current) =>
        current ? { ...current, prescription: null } : current,
      );
      toast.success("Đã xoá đơn thuốc.");
    } else {
      toast.error(result.error);
    }
  };

  const complete = async () => {
    const result = await run("complete", () =>
      apiCompleteExamination(appointmentId),
    );
    setConfirm(null);
    if (result.ok && result.data) {
      setStatus(result.data.status);
      toast.success(
        result.data.dispense_request_id
          ? "Đã hoàn tất lượt khám. Bệnh nhân qua quầy thanh toán."
          : "Đã hoàn tất lượt khám.",
      );
    } else {
      toast.error(result.error);
    }
  };

  const updateLine = (key: number, patch: Partial<Line>) => {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
    setRxDirty(true);
  };

  const addMedicine = (medicine: PrescribableMedicine) => {
    if (
      lines.some((line) => line.medicine.medicine_id === medicine.medicine_id)
    ) {
      toast.show("Thuốc này đã có trong đơn.");
      return;
    }
    setLines((current) => [
      ...current,
      {
        key: lineKey++,
        medicine,
        quantity: "1",
        dosage: "",
        frequency: "",
        duration_days: "",
        usage_instructions: "",
      },
    ]);
    setRxDirty(true);
  };

  const rxTotal = lines.reduce(
    (sum, line) =>
      sum + (Number(line.quantity) || 0) * line.medicine.unit_price,
    0,
  );
  const recordLocked = !inProgress;
  const set =
    (key: keyof RecordForm) => (event: { target: { value: string } }) => {
      setRecordForm((current) => ({ ...current, [key]: event.target.value }));
      setRecordDirty(true);
    };

  return (
    <>
      <PageHeader
        backTo="/bac-si"
        backLabel="Lịch khám"
        title={
          <>
            {appointment?.patient_full_name ?? `Lượt khám #${appointmentId}`}{" "}
            {status && (
              <StatusBadge value={labelOf(APPOINTMENT_STATUS, status)} />
            )}
          </>
        }
        description={
          appointment
            ? `${formatDate(appointment.appointment_date)} lúc ${formatTime(appointment.appointment_time)}${appointment.queue_number ? ` · Số thứ tự ${appointment.queue_number}` : ""} · Lượt khám #${appointmentId}`
            : undefined
        }
        actions={
          <>
            {status === "checked_in" && (
              <Button
                variant="primary"
                icon={<Play size={16} />}
                loading={isPending("start")}
                onClick={start}
              >
                Bắt đầu khám
              </Button>
            )}
            {inProgress && (
              <Button
                variant="success"
                icon={<CheckCircle2 size={16} />}
                disabled={!hasRecord || Boolean(pending)}
                title={hasRecord ? undefined : "Lưu bệnh án trước khi hoàn tất"}
                onClick={() => setConfirm("complete")}
              >
                Hoàn tất khám
              </Button>
            )}
            {status === "completed" && canFollowUp && patientId && (
              <Button
                variant="primary"
                icon={<CalendarPlus size={16} />}
                onClick={() => setFollowUpOpen(true)}
              >
                Hẹn tái khám
              </Button>
            )}
            {status === "completed" && (
              <Button onClick={() => navigate("/bac-si")}>Về lịch khám</Button>
            )}
          </>
        }
      />

      {followUpBooked && (
        <Alert tone="success" className="st-alert-gap">
          {followUpBooked}
        </Alert>
      )}
      {status &&
        ["pending", "pending_approval", "confirmed"].includes(status) && (
          <Alert tone="info" className="st-alert-gap">
            Bệnh nhân chưa nhận phòng. Chỉ bắt đầu khám được khi bệnh nhân đã
            check-in và đúng ngày hẹn.
          </Alert>
        )}
      {status === "completed" && (
        <Alert tone="success" className="st-alert-gap">
          Lượt khám đã hoàn tất. Bệnh án và đơn thuốc chỉ còn xem được.
        </Alert>
      )}
      {formError && (
        <Alert tone="danger" className="st-alert-gap">
          {formError}
        </Alert>
      )}

      <Steps
        current={step}
        onChange={(index) => goTo(index as 0 | 1 | 2)}
        steps={[
          { label: "Bệnh án", done: hasRecord },
          {
            label: "Đơn thuốc",
            done: Boolean(prescription) || status === "completed",
            disabled: !hasRecord,
          },
          {
            label: "Hoàn tất",
            done: status === "completed",
            disabled: !hasRecord,
          },
        ]}
      />

      <div className="st-grid-main">
        <div className="st-stack">
          {step === 0 && (
            <Panel
              title="Bệnh án"
              subtitle={
                hasRecord
                  ? recordDirty
                    ? "Có thay đổi chưa lưu"
                    : "Đã lưu"
                  : "Chưa ghi"
              }
            >
              {record.loading && !record.data ? (
                <div className="st-stack">
                  <span className="st-skel" style={{ width: "60%" }} />
                  <span className="st-skel" style={{ width: "85%" }} />
                  <span className="st-skel" style={{ width: "40%" }} />
                </div>
              ) : (
                <div className="st-form-grid">
                  <Field label="Triệu chứng" className="st-span-2">
                    {(id) => (
                      <textarea
                        id={id}
                        className="st-textarea"
                        disabled={recordLocked}
                        value={recordForm.symptoms}
                        onChange={set("symptoms")}
                      />
                    )}
                  </Field>
                  <Field label="Kết quả thăm khám" className="st-span-2">
                    {(id) => (
                      <textarea
                        id={id}
                        className="st-textarea"
                        disabled={recordLocked}
                        value={recordForm.examination_findings}
                        onChange={set("examination_findings")}
                      />
                    )}
                  </Field>
                  <Field label="Chẩn đoán" required>
                    {(id) => (
                      <input
                        id={id}
                        className="st-input"
                        disabled={recordLocked}
                        value={recordForm.diagnosis}
                        onChange={set("diagnosis")}
                      />
                    )}
                  </Field>
                  <Field label="Mã ICD-10">
                    {(id) => (
                      <input
                        id={id}
                        className="st-input st-mono"
                        disabled={recordLocked}
                        maxLength={20}
                        placeholder="VD: L70.0"
                        value={recordForm.icd10_code}
                        onChange={set("icd10_code")}
                      />
                    )}
                  </Field>
                  <Field label="Hướng điều trị" className="st-span-2">
                    {(id) => (
                      <textarea
                        id={id}
                        className="st-textarea"
                        disabled={recordLocked}
                        value={recordForm.treatment_plan}
                        onChange={set("treatment_plan")}
                      />
                    )}
                  </Field>
                  <Field label="Hẹn tái khám">
                    {(id) => (
                      <input
                        id={id}
                        type="date"
                        min={todayIso()}
                        className="st-input"
                        disabled={recordLocked}
                        value={recordForm.follow_up_date}
                        onChange={set("follow_up_date")}
                      />
                    )}
                  </Field>
                  <Field label="Dặn dò tái khám">
                    {(id) => (
                      <input
                        id={id}
                        className="st-input"
                        disabled={recordLocked}
                        value={recordForm.follow_up_notes}
                        onChange={set("follow_up_notes")}
                      />
                    )}
                  </Field>
                  <Field
                    label="Ghi chú nội bộ của bác sĩ"
                    className="st-span-2"
                    hint="Bệnh nhân không thấy ghi chú này."
                  >
                    {(id) => (
                      <textarea
                        id={id}
                        className="st-textarea"
                        disabled={recordLocked}
                        value={recordForm.doctor_notes}
                        onChange={set("doctor_notes")}
                      />
                    )}
                  </Field>
                </div>
              )}
              <div className="st-step-nav">
                <span />
                <div>
                  {hasRecord && (recordLocked || !recordDirty) && (
                    <Button
                      icon={<ArrowRight size={15} />}
                      onClick={() => goTo(1)}
                    >
                      Tiếp: Đơn thuốc
                    </Button>
                  )}
                  {!recordLocked && (
                    <Button
                      variant="primary"
                      icon={<Save size={15} />}
                      loading={isPending("record")}
                      onClick={saveRecord}
                    >
                      Lưu &amp; tiếp tục kê đơn
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          )}

          {step === 1 && (
            <Panel
              title={
                <span
                  style={{
                    display: "inline-flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <Pill size={16} /> Đơn thuốc{" "}
                  {prescription && (
                    <StatusBadge
                      value={labelOf(PRESCRIPTION_STATUS, prescription.status)}
                    />
                  )}
                </span>
              }
              subtitle={
                !hasRecord
                  ? "Lưu bệnh án trước rồi mới kê đơn."
                  : prescription && prescription.status !== "pending"
                    ? "Nhà thuốc đã soạn nên đơn không sửa được nữa."
                    : rxDirty
                      ? "Có thay đổi chưa lưu"
                      : undefined
              }
              actions={
                rxEditable &&
                prescription && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    disabled={Boolean(pending)}
                    onClick={() => setConfirm("delete-rx")}
                  >
                    Xoá đơn
                  </Button>
                )
              }
            >
              {rxEditable && (
                <div style={{ marginBottom: "0.9rem" }}>
                  <MedicineSearch onPick={addMedicine} />
                </div>
              )}

              {lines.length === 0 ? (
                <EmptyState
                  icon={<ClipboardCheck size={30} strokeWidth={1.6} />}
                  title="Chưa kê thuốc"
                  text={
                    rxEditable
                      ? "Tìm và thêm thuốc ở ô phía trên. Không kê đơn thì cứ hoàn tất khám."
                      : "Lượt khám này không có đơn thuốc."
                  }
                />
              ) : (
                <div className="st-line-items">
                  {lines.map((line) => (
                    <div key={line.key} className="st-line-item">
                      <div>
                        <div className="st-cell-main">
                          {line.medicine.medicine_name}
                        </div>
                        <div className="st-cell-sub">
                          {formatMoney(line.medicine.unit_price)}/
                          {line.medicine.unit_of_measure}
                          {line.medicine.available_stock !== undefined &&
                            ` · còn ${line.medicine.available_stock}`}
                        </div>
                      </div>
                      <Field
                        label={`SL (${line.medicine.unit_of_measure})`}
                        required
                      >
                        {(id) => (
                          <input
                            id={id}
                            type="number"
                            min={1}
                            className="st-input"
                            disabled={!rxEditable}
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(line.key, { quantity: e.target.value })
                            }
                          />
                        )}
                      </Field>
                      <Field label="Liều dùng" required>
                        {(id) => (
                          <input
                            id={id}
                            className="st-input"
                            placeholder="1 viên"
                            disabled={!rxEditable}
                            value={line.dosage}
                            onChange={(e) =>
                              updateLine(line.key, { dosage: e.target.value })
                            }
                          />
                        )}
                      </Field>
                      <Field label="Tần suất" required>
                        {(id) => (
                          <input
                            id={id}
                            className="st-input"
                            placeholder="2 lần/ngày"
                            disabled={!rxEditable}
                            value={line.frequency}
                            onChange={(e) =>
                              updateLine(line.key, {
                                frequency: e.target.value,
                              })
                            }
                          />
                        )}
                      </Field>
                      <Field label="Số ngày">
                        {(id) => (
                          <input
                            id={id}
                            type="number"
                            min={1}
                            className="st-input"
                            disabled={!rxEditable}
                            value={line.duration_days}
                            onChange={(e) =>
                              updateLine(line.key, {
                                duration_days: e.target.value,
                              })
                            }
                          />
                        )}
                      </Field>
                      {rxEditable ? (
                        <Button
                          variant="ghost"
                          iconOnly
                          aria-label={`Bỏ ${line.medicine.medicine_name}`}
                          icon={<Trash2 size={15} />}
                          onClick={() => {
                            setLines((current) =>
                              current.filter((item) => item.key !== line.key),
                            );
                            setRxDirty(true);
                          }}
                        />
                      ) : (
                        <span />
                      )}
                      <div
                        className="st-span-all"
                        style={{ gridColumn: "1 / -1" }}
                      >
                        <input
                          className="st-input"
                          aria-label={`Cách dùng ${line.medicine.medicine_name}`}
                          placeholder="Cách dùng (sau ăn, bôi mỏng…)"
                          disabled={!rxEditable}
                          value={line.usage_instructions}
                          onChange={(e) =>
                            updateLine(line.key, {
                              usage_instructions: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <Field label="Ghi chú đơn thuốc">
                        {(id) => (
                          <input
                            id={id}
                            className="st-input"
                            disabled={!rxEditable}
                            value={rxNotes}
                            onChange={(e) => {
                              setRxNotes(e.target.value);
                              setRxDirty(true);
                            }}
                          />
                        )}
                      </Field>
                    </div>
                    <div className="st-strong" style={{ paddingBottom: 8 }}>
                      Tạm tính: {formatMoney(rxTotal)}
                    </div>
                  </div>
                </div>
              )}
              <div className="st-step-nav">
                <Button
                  variant="ghost"
                  icon={<ArrowLeft size={15} />}
                  onClick={() => goTo(0)}
                >
                  Bệnh án
                </Button>
                <div>
                  {rxEditable && (
                    <Button
                      variant="primary"
                      icon={<Save size={15} />}
                      loading={isPending("rx")}
                      disabled={lines.length === 0}
                      onClick={saveRx}
                    >
                      Lưu đơn thuốc
                    </Button>
                  )}
                  <Button
                    icon={<ArrowRight size={15} />}
                    onClick={() => goTo(2)}
                  >
                    Tiếp: Hoàn tất
                  </Button>
                </div>
              </div>
            </Panel>
          )}

          {step === 2 && (
            <Panel
              title={
                <span
                  style={{
                    display: "inline-flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <ClipboardCheck size={16} /> Tóm tắt lượt khám
                </span>
              }
              subtitle={
                status === "completed"
                  ? "Đã hoàn tất — chỉ xem."
                  : "Kiểm tra lại trước khi hoàn tất khám."
              }
            >
              {(recordDirty || rxDirty) && (
                <Alert tone="warning" className="st-alert-gap">
                  Còn thay đổi chưa lưu ở{" "}
                  {recordDirty && rxDirty
                    ? "bệnh án và đơn thuốc"
                    : recordDirty
                      ? "bệnh án"
                      : "đơn thuốc"}
                  . Quay lại bước đó để lưu, nếu không thay đổi sẽ bị bỏ khi
                  hoàn tất.
                </Alert>
              )}
              <dl className="st-dl">
                <dt>Chẩn đoán</dt>
                <dd>{record.data?.diagnosis || "—"}</dd>
                <dt>ICD-10</dt>
                <dd>{record.data?.icd10_code || "—"}</dd>
                <dt>Hướng điều trị</dt>
                <dd>{record.data?.treatment_plan || "—"}</dd>
                <dt>Hẹn tái khám</dt>
                <dd>
                  {record.data?.follow_up_date
                    ? formatDate(record.data.follow_up_date)
                    : "—"}
                  {record.data?.follow_up_notes
                    ? ` · ${record.data.follow_up_notes}`
                    : ""}
                </dd>
                <dt>Đơn thuốc</dt>
                <dd>
                  {prescription?.items.length ? (
                    <>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {prescription.items.map((item) => (
                          <li key={item.medicine_id}>
                            <strong>{item.medicine_name}</strong> ×
                            {item.quantity_prescribed} {item.unit_of_measure} ·{" "}
                            {item.dosage}, {item.frequency}
                            {item.duration_days
                              ? `, ${item.duration_days} ngày`
                              : ""}
                          </li>
                        ))}
                      </ul>
                      <div
                        className="st-strong"
                        style={{ marginTop: "0.35rem" }}
                      >
                        Tạm tính:{" "}
                        {formatMoney(
                          prescription.items.reduce(
                            (sum, item) =>
                              sum + item.quantity_prescribed * item.unit_price,
                            0,
                          ),
                        )}
                      </div>
                    </>
                  ) : (
                    "Không kê đơn"
                  )}
                </dd>
              </dl>
              <div className="st-step-nav">
                <Button
                  variant="ghost"
                  icon={<ArrowLeft size={15} />}
                  onClick={() => goTo(1)}
                >
                  Đơn thuốc
                </Button>
                {inProgress && (
                  <Button
                    variant="success"
                    icon={<CheckCircle2 size={15} />}
                    disabled={!hasRecord || Boolean(pending)}
                    onClick={() => setConfirm("complete")}
                  >
                    Hoàn tất khám
                  </Button>
                )}
              </div>
            </Panel>
          )}
        </div>

        <Panel
          title={
            <span
              style={{
                display: "inline-flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <History size={16} /> Lịch sử khám
            </span>
          }
          subtitle="Các lần khám trước của bệnh nhân với bạn"
        >
          {history.loading && !history.data ? (
            <div className="st-stack">
              <span className="st-skel" />
              <span className="st-skel" style={{ width: "70%" }} />
            </div>
          ) : history.error ? (
            <Alert tone="danger">{history.error}</Alert>
          ) : (history.data?.items ?? []).filter(
              (item) => item.appointment_id !== appointmentId,
            ).length === 0 ? (
            <EmptyState
              title="Chưa có lần khám trước"
              text="Đây là lần đầu bệnh nhân khám với bạn."
            />
          ) : (
            <div className="st-stack" style={{ gap: "0.75rem" }}>
              {(history.data?.items ?? [])
                .filter((item) => item.appointment_id !== appointmentId)
                .map((item) => (
                  <details
                    key={item.medical_record_id}
                    className="st-panel"
                    style={{ padding: "0.7rem 0.85rem" }}
                  >
                    <summary style={{ cursor: "pointer" }}>
                      <span className="st-cell-main">{item.diagnosis}</span>
                      <span className="st-cell-sub">
                        {" "}
                        · {formatDate(item.appointment_date)}
                      </span>
                    </summary>
                    <dl className="st-dl" style={{ marginTop: "0.6rem" }}>
                      <dt>Triệu chứng</dt>
                      <dd>{item.symptoms ?? "—"}</dd>
                      <dt>Thăm khám</dt>
                      <dd>{item.examination_findings ?? "—"}</dd>
                      <dt>ICD-10</dt>
                      <dd>{item.icd10_code ?? "—"}</dd>
                      <dt>Điều trị</dt>
                      <dd>{item.treatment_plan ?? "—"}</dd>
                      <dt>Thuốc</dt>
                      <dd>
                        {item.prescription?.items.length
                          ? item.prescription.items
                              .map(
                                (rx) =>
                                  `${rx.medicine_name} ×${rx.quantity_prescribed}`,
                              )
                              .join(", ")
                          : "—"}
                      </dd>
                    </dl>
                  </details>
                ))}
            </div>
          )}
        </Panel>
      </div>

      <FollowUpSheet
        open={followUpOpen}
        appointmentId={appointmentId}
        patientName={appointment?.patient_full_name ?? ""}
        suggestedDate={recordForm.follow_up_date}
        onClose={() => setFollowUpOpen(false)}
        onBooked={(booked) => {
          setFollowUpOpen(false);
          setFollowUpBooked(
            `Đã hẹn tái khám ${formatDate(booked.appointment_date)} lúc ${formatTime(booked.appointment_time)} (lượt khám #${booked.appointment_id}).`,
          );
          toast.success("Đã đặt lịch tái khám.");
        }}
      />
      <ConfirmDialog
        open={confirm === "complete"}
        title="Hoàn tất lượt khám?"
        text={
          recordDirty || rxDirty
            ? "Bạn còn thay đổi chưa lưu ở bệnh án hoặc đơn thuốc — những thay đổi đó sẽ bị bỏ. Sau khi hoàn tất, bệnh án không sửa được nữa."
            : "Sau khi hoàn tất, bệnh án không sửa được nữa và bệnh nhân được chuyển qua quầy thanh toán."
        }
        confirmLabel="Hoàn tất"
        tone="success"
        loading={isPending("complete")}
        onConfirm={complete}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete-rx"}
        title="Xoá đơn thuốc?"
        text="Toàn bộ thuốc đã kê cho lượt khám này sẽ bị xoá."
        confirmLabel="Xoá đơn"
        tone="danger-solid"
        loading={isPending("delete-rx")}
        onConfirm={deleteRx}
        onClose={() => setConfirm(null)}
      />
    </>
  );
};

export default ExaminationPage;
