import PDFDocument from "pdfkit";

interface CertificateData {
  studentName: string;
  courseName: string;
  instructorName: string;
  issuedDate: string; // formatted string, e.g. "20 tháng 3, 2026"
  serialNumber: string; // e.g. "NC-XXXXXXXX"
}

/**
 * Tạo PDF chứng chỉ dạng A4 ngang (landscape).
 * Sử dụng pdfkit với các font built-in để tránh dependency nặng.
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      info: {
        Title: `Certificate - ${data.studentName}`,
        Author: "Noble Cert",
        Subject: data.courseName,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 841.89
    const H = doc.page.height;  // 595.28

    const GOLD = "#D4AF37";
    const DARK = "#1A1A1A";
    const GRAY = "#6B7280";
    const LIGHT_GRAY = "#9CA3AF";
    const TEAL = "#0f766e";

    // ── Background ─────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill("#FAFAF8");

    // ── Gold border ────────────────────────────────────────────────
    doc.rect(18, 18, W - 36, H - 36).stroke(GOLD).lineWidth(1.5);
    // Inner dashed border (simulate with thinner rect)
    doc.rect(28, 28, W - 56, H - 56).stroke(GOLD).lineWidth(0.4).dash(6, { space: 3 });
    doc.undash();

    // ── Top gold band ──────────────────────────────────────────────
    doc.rect(18, 18, W - 36, 5).fill(GOLD);
    // ── Bottom gold band ──────────────────────────────────────────
    doc.rect(18, H - 23, W - 36, 5).fill(GOLD);

    // ── Corner ornaments ──────────────────────────────────────────
    const corners = [
      { x: 50, y: 50, dx: 1, dy: 1 },
      { x: W - 50, y: 50, dx: -1, dy: 1 },
      { x: 50, y: H - 50, dx: 1, dy: -1 },
      { x: W - 50, y: H - 50, dx: -1, dy: -1 },
    ];
    corners.forEach(({ x, y, dx, dy }) => {
      doc.moveTo(x, y).lineTo(x, y + dy * 18).stroke(GOLD).lineWidth(1.5);
      doc.moveTo(x, y).lineTo(x + dx * 18, y).stroke(GOLD).lineWidth(1.5);
    });

    // ── Issuer name ────────────────────────────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#9A7B2A")
      .text("NOBLE CERT", 0, 72, { align: "center", characterSpacing: 5 });

    // ── Divider line ───────────────────────────────────────────────
    const midX = W / 2;
    doc.moveTo(midX - 160, 90).lineTo(midX + 160, 90).stroke(GOLD).lineWidth(0.75);
    doc.circle(midX, 90, 2.5).fill(GOLD);

    // ── Main title ────────────────────────────────────────────────
    doc
      .font("Times-Bold")
      .fontSize(34)
      .fillColor(DARK)
      .text("Certificate of Completion", 0, 108, { align: "center", characterSpacing: 1 });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(GRAY)
      .text("CHỨNG NHẬN HOÀN THÀNH KHOÁ HỌC", 0, 150, { align: "center", characterSpacing: 3 });

    // ── Presented text ────────────────────────────────────────────
    doc
      .font("Times-Roman")
      .fontSize(10)
      .fillColor(LIGHT_GRAY)
      .text("This is to certify that", 0, 198, { align: "center", characterSpacing: 1.5 });

    // ── Student name ──────────────────────────────────────────────
    doc
      .font("Times-Bold")
      .fontSize(38)
      .fillColor(DARK)
      .text(data.studentName, 0, 222, { align: "center" });

    // Name underline
    const nameWidth = Math.min(doc.widthOfString(data.studentName) + 60, 500);
    doc
      .moveTo(midX - nameWidth / 2, 272)
      .lineTo(midX + nameWidth / 2, 272)
      .stroke(GOLD)
      .lineWidth(0.75);

    // ── Completion text ───────────────────────────────────────────
    doc
      .font("Times-Roman")
      .fontSize(10)
      .fillColor(LIGHT_GRAY)
      .text("has successfully completed the course", 0, 283, { align: "center", characterSpacing: 1.5 });

    // ── Course name ───────────────────────────────────────────────
    doc
      .font("Times-Bold")
      .fontSize(20)
      .fillColor(GOLD)
      .text(data.courseName, 60, 306, { align: "center", width: W - 120 });

    // ── Bottom info row ───────────────────────────────────────────
    const bottomY = H - 150;

    // Left: Issue date
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(LIGHT_GRAY)
      .text("NGÀY CẤP", 60, bottomY, { align: "center", width: 160, characterSpacing: 1 });
    doc
      .font("Times-Bold")
      .fontSize(11)
      .fillColor("#374151")
      .text(data.issuedDate, 60, bottomY + 16, { align: "center", width: 160 });

    // Left signature line
    doc
      .moveTo(80, bottomY + 10)
      .lineTo(220, bottomY + 10)
      .stroke(GOLD)
      .lineWidth(0.5);

    // Center: Seal circle
    const sealX = midX;
    const sealY = bottomY + 20;
    doc.circle(sealX, sealY, 40).stroke(GOLD).lineWidth(1.2);
    doc.circle(sealX, sealY, 33).stroke(GOLD).lineWidth(0.4);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(GOLD)
      .text("NOBLE", sealX - 20, sealY - 14, { width: 40, align: "center", characterSpacing: 1 });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(GOLD)
      .text("CERT", sealX - 20, sealY - 2, { width: 40, align: "center", characterSpacing: 1 });
    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor("#9A7B2A")
      .text("✦ VERIFIED ✦", sealX - 25, sealY + 11, { width: 50, align: "center", characterSpacing: 1.5 });

    // Right: Instructor
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(LIGHT_GRAY)
      .text("GIẢNG VIÊN", W - 220, bottomY, { align: "center", width: 160, characterSpacing: 1 });
    doc
      .font("Times-Bold")
      .fontSize(11)
      .fillColor("#374151")
      .text(data.instructorName, W - 220, bottomY + 16, { align: "center", width: 160 });

    // Right signature line
    doc
      .moveTo(W - 220, bottomY + 10)
      .lineTo(W - 80, bottomY + 10)
      .stroke(GOLD)
      .lineWidth(0.5);

    // ── Noble signature (teal) ────────────────────────────────────
    doc
      .font("Times-BoldItalic")
      .fontSize(16)
      .fillColor(TEAL)
      .text("Noble Cert", 0, bottomY + 40, { align: "center" });

    // ── Serial number ─────────────────────────────────────────────
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(LIGHT_GRAY)
      .text(`ID: ${data.serialNumber}`, 0, H - 40, { align: "center", characterSpacing: 1.5 });

    doc.end();
  });
}
