"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  FileText,
  Lock,
  Search,
  CheckCircle2,
  Circle,
  Info,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { createPatientForOrganization, NikAlreadyRegisteredError } from "@/services/patients";
import { Button } from "@/components/ui/Button";

export default function NewPatientRegisterPage() {
  const router = useRouter();

  // Form States
  const [patientName, setPatientName] = useState("");
  const [nik, setNik] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [showGuardian, setShowGuardian] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Screening Context States
  const [pastAnemia, setPastAnemia] = useState<string>("no");
  const [familyAnemia, setFamilyAnemia] = useState<string>("no");
  const [conditions, setConditions] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState("");
  const [symptomDuration, setSymptomDuration] = useState("");

  const SYMPTOM_OPTIONS = [
    "Lelah Berlebih",
    "Lemas / Lunglai",
    "Pusing / Sakit Kepala",
    "Sulit Konsentrasi",
    "Napas Pendek / Sesak",
    "Kulit Pucat",
    "Jantung Berdebar",
    "Tangan Kaki Dingin",
  ];

  const CONDITION_OPTIONS = [
    { id: "ginjal", label: "Gangguan Ginjal" },
    { id: "hati", label: "Penyakit Hati" },
    { id: "talasemia", label: "Talasemia" },
    { id: "autoimun", label: "Autoimun" },
    { id: "kanker", label: "Kanker" },
    { id: "perdarahan", label: "Perdarahan Akut" },
    { id: "malaria", label: "Malaria" },
    { id: "gastritis", label: "Gastritis" },
  ];

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const toggleCondition = (id: string) => {
    if (conditions.includes(id)) {
      setConditions(conditions.filter((c) => c !== id));
    } else {
      setConditions([...conditions, id]);
    }
  };

  const DURATION_LABELS: Record<string, string> = {
    "less-1-week": "kurang dari 1 minggu",
    "1-4-weeks": "1-4 minggu",
    "1-3-months": "1-3 bulan",
    "more-3-months": "lebih dari 3 bulan",
  };

  const computedAge = birthDate
    ? Math.max(0, new Date().getFullYear() - new Date(birthDate).getFullYear())
    : null;

  const contextPrediction =
    selectedSymptoms.length > 0 && symptomDuration
      ? `Berdasarkan durasi gejala (${DURATION_LABELS[symptomDuration]}) dan gejala ${selectedSymptoms
          .join(", ")
          .toLowerCase()}, disarankan pemeriksaan konjungtiva segera.`
      : null;

  const savePatient = async (onSaved: (patientId: string, organizationId: string) => void) => {
    const organizationId = sessionStorage.getItem("hv_org_id");
    if (!organizationId) {
      setSubmitError("Sesi organisasi tidak ditemukan, silakan login ulang.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const { patientId } = await createPatientForOrganization({
        organizationId,
        displayName: patientName,
        nik,
        dob: birthDate,
        sex: gender === "male" ? "M" : "F",
      });
      onSaved(patientId, organizationId);
    } catch (error) {
      setSubmitError(
        error instanceof NikAlreadyRegisteredError
          ? "NIK ini sudah terdaftar. Cari pasien tersebut di daftar Pasien untuk memulai skrining baru."
          : "Gagal menyimpan pasien, periksa NIK dan data lain lalu coba lagi."
      );
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePatient((patientId, organizationId) => {
      router.push(`${ROUTES.NAKES.SKRINING_PERIKSA_KAMERA}?patientId=${patientId}&organizationId=${organizationId}`);
    });
  };

  return (
    <div className="min-h-screen bg-surface pt-6 sm:pt-8 lg:pt-10 px-6 sm:px-8 lg:px-10 pb-56 space-y-8 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <Link href={ROUTES.NAKES.PASIEN_LIST} className="hover:text-primary">
              Pasien
            </Link>
            <span>›</span>
            <span className="text-on-surface">Tambah Pasien</span>
          </div>

          <h1 className="text-3xl sm:text-[32px] font-bold text-on-surface leading-tight tracking-tight">
            Daftarkan Pasien Baru
          </h1>
          <p className="text-sm text-on-surface-variant max-w-2xl">
            Lengkapi informasi pasien yang diperlukan sebelum melakukan skrining SEHATI untuk akurasi analisis AI PallorSense.
          </p>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href={ROUTES.NAKES.PASIEN_LIST}>
            <Button type="button" variant="outline" leftIcon={<Search className="w-4 h-4 text-primary" />}>
              Cari Pasien
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Form Left (Span 2) & Summary Right (Span 1) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Identitas Pasien */}
          <div className="bg-white rounded-xl outline outline-1 outline-outline shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-primary-container rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Identitas Pasien</h2>
            </div>

            <div className="space-y-5">
              {/* Nama Lengkap Pasien */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Nama Lengkap Pasien</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-3 bg-white border border-outline rounded-xl text-sm text-on-surface placeholder:text-on-surface-subtle focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              {/* NIK */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">NIK (16 digit)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="16 digit sesuai KTP"
                  pattern="\d{16}"
                  className="w-full px-4 py-3 bg-white border border-outline rounded-xl text-sm text-on-surface placeholder:text-on-surface-subtle focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Tanggal Lahir & Jenis Kelamin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-outline rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-outline rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Nomor Rekam Medis (Auto) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Nomor Rekam Medis (Auto)</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value="Akan dibuat otomatis setelah disimpan"
                    readOnly
                    className="w-full pl-4 pr-10 py-3 bg-surface-container-low border border-outline rounded-xl text-sm text-on-surface-variant cursor-not-allowed"
                  />
                  <Lock className="w-4 h-4 text-on-surface-muted absolute right-4 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Informasi Kontak */}
          <div className="bg-white rounded-xl outline outline-1 outline-outline shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-primary-container rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Informasi Kontak</h2>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nomor Telepon / WhatsApp */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Nomor Telepon / WhatsApp</label>
                  <div className="flex items-center">
                    <span className="px-3.5 py-3 bg-surface-container-low border border-r-0 border-outline rounded-l-xl text-sm font-bold text-on-surface">
                      +62
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="812 3456 7890"
                      className="w-full px-4 py-3 bg-white border border-outline rounded-r-xl text-sm text-on-surface placeholder:text-on-surface-subtle focus:outline-none focus:border-primary transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Alamat Email (Opsional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi.santoso@email.com"
                    className="w-full px-4 py-3 bg-white border border-outline rounded-xl text-sm text-on-surface placeholder:text-on-surface-subtle focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Accordion / Checkbox: Pendamping */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuardian(!showGuardian)}
                  className="w-full px-4 py-3.5 bg-surface-container-low border border-outline rounded-xl flex items-center justify-between text-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  <span>Tambahkan informasi pendamping / keluarga</span>
                  <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${showGuardian ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Konteks Skrining & Gejala */}
          <div className="bg-white rounded-xl outline outline-1 outline-outline shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-primary-container rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Konteks Skrining & Gejala</h2>
            </div>

            <div className="space-y-6">
              {/* Radio 1: Pernah didiagnosa anemia? */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-xl border border-outline bg-white space-y-3">
                  <label className="text-sm font-semibold text-on-surface block leading-snug">
                    Pernah didiagnosa anemia sebelumnya?
                  </label>
                  <div className="flex items-center gap-4 text-xs font-medium text-on-surface">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="pastAnemia"
                        value="yes"
                        checked={pastAnemia === "yes"}
                        onChange={() => setPastAnemia("yes")}
                        className="accent-primary"
                      />
                      <span>Ya</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="pastAnemia"
                        value="no"
                        checked={pastAnemia === "no"}
                        onChange={() => setPastAnemia("no")}
                        className="accent-primary"
                      />
                      <span>Tidak</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="pastAnemia"
                        value="unknown"
                        checked={pastAnemia === "unknown"}
                        onChange={() => setPastAnemia("unknown")}
                        className="accent-primary"
                      />
                      <span>Tidak Diketahui</span>
                    </label>
                  </div>
                </div>

                {/* Radio 2: Riwayat keluarga? */}
                <div className="p-4 sm:p-5 rounded-xl border border-outline bg-white space-y-3">
                  <label className="text-sm font-semibold text-on-surface block leading-snug">
                    Ada riwayat anemia dalam keluarga?
                  </label>
                  <div className="flex items-center gap-4 text-xs font-medium text-on-surface">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="familyAnemia"
                        value="yes"
                        checked={familyAnemia === "yes"}
                        onChange={() => setFamilyAnemia("yes")}
                        className="accent-primary"
                      />
                      <span>Ya</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="familyAnemia"
                        value="no"
                        checked={familyAnemia === "no"}
                        onChange={() => setFamilyAnemia("no")}
                        className="accent-primary"
                      />
                      <span>Tidak</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="familyAnemia"
                        value="unknown"
                        checked={familyAnemia === "unknown"}
                        onChange={() => setFamilyAnemia("unknown")}
                        className="accent-primary"
                      />
                      <span>Tidak Diketahui</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Kondisi Kesehatan Relevan */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Kondisi Kesehatan Relevan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CONDITION_OPTIONS.map((item) => {
                    const isChecked = conditions.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCondition(item.id)}
                        className={`p-3.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center gap-2 cursor-pointer ${
                          isChecked
                            ? "border-primary bg-blue-50/60 text-primary font-bold"
                            : "border-outline bg-white text-on-surface hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? "border-primary bg-primary" : "border-outline"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gejala Yang Dilaporkan */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Gejala Yang Dilaporkan
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SYMPTOM_OPTIONS.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white shadow-sm"
                            : "bg-white border border-outline text-on-surface hover:border-slate-400"
                        }`}
                      >
                        {symptom}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gejala Lainnya & Durasi */}
              <div className="space-y-5 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Gejala Lainnya</label>
                  <input
                    type="text"
                    value={otherSymptoms}
                    onChange={(e) => setOtherSymptoms(e.target.value)}
                    placeholder="Input gejala"
                    className="w-full px-4 py-3 bg-white border border-outline rounded-xl text-sm text-on-surface placeholder:text-on-surface-subtle focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Durasi Gejala</label>
                  <select
                    value={symptomDuration}
                    onChange={(e) => setSymptomDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-outline rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="" disabled>
                      Pilih durasi
                    </option>
                    <option value="less-1-week">Kurang dari 1 minggu</option>
                    <option value="1-4-weeks">1 - 4 minggu</option>
                    <option value="1-3-months">1 - 3 bulan</option>
                    <option value="more-3-months">Lebih dari 3 bulan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Tips */}
        <div className="space-y-6">
          {/* Card 1: Ringkasan Pasien */}
          <div className="bg-surface-container-low rounded-xl outline outline-1 outline-outline shadow-sm p-6 space-y-6">
            <h3 className="text-base font-bold text-on-surface border-b border-outline pb-3">
              Ringkasan Pasien
            </h3>

            {/* Detail Utama */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block">
                DETAIL UTAMA
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-on-surface">{patientName || "Nama Pasien"}</span>
                </div>
                <p className="text-xs text-on-surface-variant pl-6">
                  {computedAge !== null ? `${computedAge} Tahun` : "Usia belum diisi"} •{" "}
                  {gender === "male" ? "Laki-laki" : "Perempuan"}
                </p>
                <p className="text-xs font-mono text-on-surface-variant pl-6">
                  RM: dibuat otomatis setelah disimpan
                </p>
              </div>
            </div>

            {/* Kelengkapan Data */}
            {(() => {
              const checklist = [
                {
                  label: "Identitas Utama Lengkap",
                  done: Boolean(patientName && nik.length === 16 && birthDate),
                },
                { label: "Kontak Diisi", done: Boolean(phone) },
                {
                  label: "Informasi Medis Tambahan",
                  done: conditions.length > 0 || selectedSymptoms.length > 0,
                },
              ];
              const completion = Math.round(
                (checklist.filter((item) => item.done).length / checklist.length) * 100
              );
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-on-surface-variant">
                      KELENGKAPAN DATA
                    </span>
                    <span className="font-mono font-bold text-primary">{completion}%</span>
                  </div>

                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    {checklist.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 ${
                          item.done ? "text-tertiary font-medium" : "text-on-surface-variant"
                        }`}
                      >
                        {item.done ? (
                          <CheckCircle2 className="w-4 h-4 text-tertiary" />
                        ) : (
                          <Circle className="w-4 h-4 text-outline" />
                        )}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Prediksi Konteks Box */}
            {contextPrediction && (
              <div className="p-4 bg-primary-container/30 rounded-xl border border-primary/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Prediksi Konteks</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed font-normal">
                  {contextPrediction}
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Tips Skrining Akurat */}
          <div className="bg-tertiary-container/30 border border-tertiary/20 rounded-xl p-5 flex items-start gap-3.5 shadow-sm">
            <Info className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-tertiary-alt uppercase tracking-wider">
                Tips Skrining Akurat
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Pastikan pasien melepas kacamata atau lensa kontak sebelum memulai prosedur pengambilan gambar mata.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Bottom Action Bar starting after desktop sidebar */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white border-t border-outline px-6 sm:px-10 py-4 z-40 shadow-lg">
        {submitError && (
          <p className="max-w-7xl mx-auto pb-2 text-sm text-error font-medium">{submitError}</p>
        )}
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-4">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Simpan &amp; Mulai Skrining
          </Button>
        </div>
      </div>
    </div>
  );
}
