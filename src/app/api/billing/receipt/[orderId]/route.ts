import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { formatSatang } from "@/lib/billing";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = params;

    const order = await prisma.billingOrder.findUnique({
      where: { id: orderId },
      include: {
        organization: {
          include: {
            billingProfile: true,
          },
        },
        billingDocuments: {
          where: { documentType: "RECEIPT", status: "VALID" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    if (!user.isPlatformAdmin) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: order.organizationId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const doc = order.billingDocuments[0];
    const bp = order.organization.billingProfile;

    const docNumber = doc?.documentNumber || `REC-${order.orderNumber}`;
    const issueDate = doc?.issuedAt || order.reviewedAt || order.createdAt;
    const formattedDate = new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(issueDate);

    const customerName = doc?.customerName || bp?.companyName || order.organization.name;
    const customerAddress = doc?.customerAddress || bp?.address || "-";
    const customerTaxId = doc?.customerTaxId || bp?.taxId || "-";

    const amountDisplay = formatSatang(order.amountSatang, true);
    const netAmountDisplay = formatSatang(order.netAmountSatang, true);

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ใบเสร็จรับเงิน / ใบยืนยันการชำระเงิน - ${docNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Sarabun', sans-serif;
      margin: 0;
      padding: 40px;
      color: #1e293b;
      background-color: #f8fafc;
    }
    .sheet {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      color: #0284c7;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .doc-num {
      font-size: 14px;
      font-weight: 600;
      color: #0284c7;
      margin: 0 0 2px 0;
    }
    .doc-date {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    .info-box {
      background: #f8fafc;
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .info-val {
      font-size: 14px;
      color: #1e293b;
      line-height: 1.5;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 13px;
      font-weight: 600;
      text-align: left;
      padding: 12px 16px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .col-right {
      text-align: right;
    }
    .total-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .total-box {
      width: 320px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .total-row.grand {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 10px 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 8px;
    }
    .footer-note {
      border-top: 1px dashed #cbd5e1;
      padding-top: 20px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
    .print-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0284c7;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn:hover {
      background: #0369a1;
    }
    @media print {
      body {
        padding: 0;
        background: #fff;
      }
      .sheet {
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .print-btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ พิมพ์เอกสาร</button>
  
  <div class="sheet">
    <div class="header">
      <div>
        <h1 class="brand-title">PdhFeedback</h1>
        <p class="brand-sub">ระบบประเมินความพึงพอใจการบริการ Multi-tenant SaaS</p>
        <p class="brand-sub">ผู้ให้บริการ: บจก. ทอมวิส ดิจิทัล (Tomvis Digital Co., Ltd.)</p>
        <p class="brand-sub">เลขประจำตัวผู้เสียภาษี: 0105566012345</p>
      </div>
      <div class="doc-meta">
        <h2 class="doc-title">ใบยืนยันการรับชำระเงิน</h2>
        <p class="doc-num">เลขที่: ${docNumber}</p>
        <p class="doc-date">วันที่ออก: ${formattedDate}</p>
        <p class="doc-date">เลขอ้างอิง: ${order.orderNumber}</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">ข้อมูลลูกค้า / องค์กร</div>
        <div class="info-val"><strong>${customerName}</strong></div>
        <div class="info-val">ที่อยู่: ${customerAddress}</div>
        <div class="info-val">เลขประจำตัวผู้เสียภาษี: ${customerTaxId}</div>
      </div>
      <div class="info-box">
        <div class="info-label">วิธีการชำระเงิน</div>
        <div class="info-val"><strong>โอนเงินผ่านบัญชีธนาคาร / QR PromptPay</strong></div>
        <div class="info-val">สถานะ: <strong>ชำระเงินเรียบร้อยแล้ว (APPROVED)</strong></div>
        <div class="info-val">รอบบริการ: ${order.billingInterval === "ANNUAL" ? "รายปี (Annual)" : "รายเดือน (Monthly)"}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 8%;">ลำดับ</th>
          <th style="width: 52%;">รายการ</th>
          <th style="width: 15%; text-align: center;">รอบบริการ</th>
          <th style="width: 25%;" class="col-right">จำนวนเงิน (บาท)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>ค่าบริการระบบ PdhFeedback SaaS (${order.planNameSnapshot})</strong>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
              แพ็กเกจ ${order.planCodeSnapshot} - สิทธิ์ใช้งานจุดบริการ, แบบประเมิน และโควตาคำตอบตามเงื่อนไข
            </div>
          </td>
          <td style="text-align: center;">${order.billingInterval === "ANNUAL" ? "1 ปี" : "1 เดือน"}</td>
          <td class="col-right">${amountDisplay}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-box">
        <div class="total-row">
          <span>รวมเป็นเงิน</span>
          <span>${amountDisplay} บาท</span>
        </div>
        <div class="total-row">
          <span>ภาษีมูลค่าเพิ่ม (VAT 0%)*</span>
          <span>0.00 บาท</span>
        </div>
        <div class="total-row grand">
          <span>ยอดเงินสุทธิ</span>
          <span>${netAmountDisplay} บาท</span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      * เอกสารนี้เป็นหลักฐานการรับชำระเงินค่าบริการระบบ PdhFeedback ที่ออกโดยอัตโนมัติจากระบบอิเล็กทรอนิกส์<br>
      หากต้องการใบกำกับภาษีเต็มรูปแบบ กรุณาติดต่อฝ่ายบัญชีและการเงินที่ support@pdhfeedback.local
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    console.error("Receipt render error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
