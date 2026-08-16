import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { assignedBarangayForUser } from "@/lib/barangayScope";
import { getDashboardViewer, dashboardViewerRole } from "@/lib/dashboardViewer";
import { getCampaign, getCampaignBarangayItem, getCampaignProgress, refreshCampaignExpiration, reconcileCampaignDistributionReadiness } from "@/lib/emergencyCampaigns";
import { getDistributionHistoryForViewerByBatch } from "@/lib/emergencyDistribution";
import { getBarangayBreakdown, getNotReceivedRows, getReportSummary, resolveReportAccess } from "@/lib/emergencyReports";

type ExportDistribution = {
  family_name?: string | null;
  family_head_name?: string | null;
  barangay_name?: string | null;
  verified_by_name?: string | null;
  verified_at?: string | null;
  status?: string | null;
};

const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF0F61FF" } };
const summaryFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFEFF6FF" } };

export async function GET(request: NextRequest) {
  try {
    const viewer = await getDashboardViewer(request);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const role = dashboardViewerRole(viewer);
    if (role !== "barangay" && role !== "super" && role !== "cswdd") {
      return NextResponse.json({ success: false, error: "You do not have access to relief distribution exports." }, { status: 403 });
    }

    const batchId = String(request.nextUrl.searchParams.get("batchId") ?? request.nextUrl.searchParams.get("batch_id") ?? "").trim();
    if (!batchId) {
      return NextResponse.json({ success: false, error: "batchId is required." }, { status: 400 });
    }

    const campaign = await getCampaign(batchId);
    if (!campaign) {
      return NextResponse.json({ success: false, error: "Selected relief campaign was not found." }, { status: 404 });
    }

    const effectiveCampaign = await reconcileCampaignDistributionReadiness(await refreshCampaignExpiration(campaign, viewer), viewer);
    const progress = await getCampaignProgress(batchId, role === "barangay" ? viewer : null);
    let exportBarangayName = "All Barangays";

    if (role === "barangay") {
      const barangay = assignedBarangayForUser(viewer);
      if (!barangay) {
        return NextResponse.json({ success: false, error: "Your account is not assigned to a barangay." }, { status: 403 });
      }

      const item = await getCampaignBarangayItem(batchId, barangay.barangay_id);
      if (!item) {
        return NextResponse.json({ success: false, error: "Selected relief campaign is not available to your barangay." }, { status: 403 });
      }
      exportBarangayName = barangay.barangay_name || String(item.barangay_name ?? "Assigned Barangay");
    } else if (progress.barangays.length === 1) {
      exportBarangayName = progress.barangays[0]?.barangay_name || exportBarangayName;
    }

    const history = await getDistributionHistoryForViewerByBatch(viewer, batchId);
    if (history.status !== "OK") {
      return NextResponse.json({ success: false, error: history.reason ?? "Unable to export relief distribution records." }, { status: 403 });
    }

    const distributions = history.distributions as ExportDistribution[];
    const reportAccess = await resolveReportAccess(viewer, batchId);
    if ("status" in reportAccess) {
      return NextResponse.json({ success: false, error: reportAccess.reason }, { status: reportAccess.status === "NOT_FOUND" ? 404 : 403 });
    }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SmartFlood";
    workbook.created = new Date();

    if (role !== "barangay") {
      const [summary, breakdown, notReceived] = await Promise.all([
        getReportSummary(reportAccess),
        getBarangayBreakdown(reportAccess),
        getNotReceivedRows(reportAccess),
      ]);
      addAdminSummarySheet(workbook, summary);
      addBarangayBreakdownSheet(workbook, breakdown);
      addAdminHistorySheet(workbook, distributions, effectiveCampaign.plan_name);
      addNotReceivedSheet(workbook, notReceived);
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      const filename = `${reportFilename(effectiveCampaign.plan_name)}_Relief_Report_${formatDateForFilename(new Date())}.xlsx`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Cache-Control": "no-store",
        },
      });
    }

    const distributionSheet = workbook.addWorksheet("Relief Distribution", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    distributionSheet.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "Family", key: "family", width: 30 },
      { header: "Family Head", key: "family_head", width: 30 },
      { header: "Barangay", key: "barangay", width: 24 },
      { header: "Relief Program", key: "relief_program", width: 30 },
      { header: "Strategy", key: "strategy", width: 22 },
      { header: "Received At", key: "received_at", width: 24 },
      { header: "Verified By", key: "verified_by", width: 26 },
      { header: "Status", key: "status", width: 16 },
    ];
    styleHeaderRow(distributionSheet.getRow(1));

    distributions.forEach((record, index) => {
      distributionSheet.addRow({
        no: index + 1,
        family: String(record.family_name ?? "Family"),
        family_head: String(record.family_head_name ?? "Not recorded"),
        barangay: String(record.barangay_name ?? exportBarangayName),
        relief_program: effectiveCampaign.plan_name,
        strategy: formatStatus(effectiveCampaign.plan_id),
        received_at: formatDateTime(record.verified_at),
        verified_by: String(record.verified_by_name ?? "Not recorded"),
        status: formatStatus(record.status),
      });
    });
    if (distributions.length === 0) distributionSheet.addRow({});

    distributionSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = lightBorder();
      });
    });

    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [{ width: 30 }, { width: 44 }];
    const received = distributions.filter((record) => record.status === "received").length;
    const rejected = distributions.filter((record) => record.status === "rejected").length;
    const summaryRows: Array<[string, string | number]> = [
      ["SmartFlood Relief Distribution Report", ""],
      ["Barangay:", exportBarangayName],
      ["Relief Program:", effectiveCampaign.plan_name],
      ["Strategy:", formatStatus(effectiveCampaign.plan_id)],
      ["Distribution Date:", formatDate(new Date().toISOString())],
      ["Campaign Status:", formatStatus(effectiveCampaign.status)],
      ["Total Families Served:", distributions.length],
      ["Total Received:", received],
      ["Total Rejected:", rejected],
      ["Generated At:", formatDateTime(new Date().toISOString())],
    ];

    summaryRows.forEach((row, index) => {
      const excelRow = summarySheet.addRow(row);
      excelRow.height = index === 0 ? 26 : 20;
      excelRow.eachCell((cell, cellIndex) => {
        cell.border = lightBorder();
        cell.alignment = { vertical: "middle", wrapText: true };
        if (index === 0) {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
          cell.fill = headerFill;
        } else if (cellIndex === 1) {
          cell.font = { bold: true, color: { argb: "FF14385F" } };
          cell.fill = summaryFill;
        }
      });
    });
    summarySheet.mergeCells("A1:B1");

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const filename = `${filenameBarangay(exportBarangayName)}ReliefData(${formatDateForFilename(new Date())}).xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to export relief distribution records." }, { status: 500 });
  }
}

function addAdminSummarySheet(workbook: ExcelJS.Workbook, summary: Awaited<ReturnType<typeof getReportSummary>>) {
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [{ width: 30 }, { width: 44 }];
  const campaign = summary.campaign;
  const rows: Array<[string, string | number]> = [
    ["SmartFlood Relief Campaign Report", ""],
    ["Campaign:", String(campaign?.plan_name ?? "")],
    ["Strategy:", formatStatus(campaign?.plan_id)],
    ["Status:", formatStatus(campaign?.status)],
    ["Started:", formatDateTime(campaign?.started_at ?? campaign?.accepted_at ?? campaign?.created_at)],
    ["Closed / Expiration:", formatDateTime(campaign?.closed_at ?? campaign?.expires_at)],
    ["Barangays:", summary.barangays],
    ["Eligible:", summary.eligible],
    ["Received:", summary.received],
    ["Not Received:", summary.not_received],
    ["Coverage:", `${summary.coverage}%`],
  ];
  rows.forEach((row, index) => {
    const excelRow = sheet.addRow(row);
    excelRow.eachCell((cell, cellIndex) => {
      cell.border = lightBorder();
      cell.alignment = { vertical: "middle", wrapText: true };
      if (index === 0) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
        cell.fill = headerFill;
      } else if (cellIndex === 1) {
        cell.font = { bold: true, color: { argb: "FF14385F" } };
        cell.fill = summaryFill;
      }
    });
  });
  sheet.mergeCells("A1:B1");
}

function addBarangayBreakdownSheet(workbook: ExcelJS.Workbook, rows: Awaited<ReturnType<typeof getBarangayBreakdown>>) {
  const sheet = workbook.addWorksheet("Barangay Breakdown", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Barangay", key: "barangay", width: 28 },
    { header: "Eligible", key: "eligible", width: 14 },
    { header: "Received", key: "received", width: 14 },
    { header: "Not Received", key: "not_received", width: 16 },
    { header: "Coverage", key: "coverage", width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));
  rows.forEach((row) => sheet.addRow({
    barangay: row.barangay_name,
    eligible: row.eligible,
    received: row.received,
    not_received: row.not_received,
    coverage: `${row.coverage}%`,
  }));
  if (rows.length === 0) sheet.addRow({});
  styleBody(sheet);
}

function addAdminHistorySheet(workbook: ExcelJS.Workbook, rows: ExportDistribution[], campaignName: string) {
  const sheet = workbook.addWorksheet("Distribution History", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Family", key: "family", width: 30 },
    { header: "Family Head", key: "family_head", width: 30 },
    { header: "Barangay", key: "barangay", width: 24 },
    { header: "Campaign", key: "campaign", width: 30 },
    { header: "Status", key: "status", width: 16 },
    { header: "Received At", key: "received_at", width: 24 },
  ];
  styleHeaderRow(sheet.getRow(1));
  rows.forEach((row) => sheet.addRow({
    family: String(row.family_name ?? "Family"),
    family_head: String(row.family_head_name ?? "Not recorded"),
    barangay: String(row.barangay_name ?? "Not recorded"),
    campaign: campaignName,
    status: formatStatus(row.status),
    received_at: formatDateTime(row.verified_at),
  }));
  if (rows.length === 0) sheet.addRow({});
  styleBody(sheet);
}

function addNotReceivedSheet(workbook: ExcelJS.Workbook, rows: Awaited<ReturnType<typeof getNotReceivedRows>>) {
  const sheet = workbook.addWorksheet("Not Received", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Family", key: "family", width: 30 },
    { header: "Family Head", key: "family_head", width: 30 },
    { header: "Barangay", key: "barangay", width: 24 },
    { header: "Eligibility", key: "eligibility", width: 16 },
    { header: "Distribution Status", key: "distribution_status", width: 22 },
  ];
  styleHeaderRow(sheet.getRow(1));
  rows.forEach((row) => sheet.addRow({
    family: row.family_name,
    family_head: row.family_head_name ?? "Not recorded",
    barangay: row.barangay_name,
    eligibility: row.eligibility,
    distribution_status: row.distribution_status,
  }));
  if (rows.length === 0) sheet.addRow({});
  styleBody(sheet);
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = headerFill;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = lightBorder();
  });
}

function styleBody(sheet: ExcelJS.Worksheet) {
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = lightBorder();
    });
  });
}

function lightBorder() {
  return {
    top: { style: "thin" as const, color: { argb: "FFDCE9F9" } },
    left: { style: "thin" as const, color: { argb: "FFDCE9F9" } },
    bottom: { style: "thin" as const, color: { argb: "FFDCE9F9" } },
    right: { style: "thin" as const, color: { argb: "FFDCE9F9" } },
  };
}

function filenameBarangay(value: string) {
  const normalized = String(value || "Barangay")
    .replace(/^barangay\s+/i, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
  return `brgy${normalized || "Relief"}`;
}

function reportFilename(value: string) {
  return String(value || "Relief")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    || "Relief";
}

function formatDateForFilename(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(value?: string | null) {
  const text = String(value ?? "").replace(/_/g, " ").trim();
  return text ? text.replace(/\b\w/g, (char) => char.toUpperCase()) : "Unknown";
}
