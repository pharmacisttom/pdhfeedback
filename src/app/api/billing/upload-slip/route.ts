import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { isBillingDisabled, BILLING_DISABLED_API_ERROR } from "@/lib/billing-config";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (isBillingDisabled()) {
      return NextResponse.json(
        {
          error: BILLING_DISABLED_API_ERROR,
          billingMode: "disabled",
        },
        { status: 403 }
      );
    }

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const formData = await req.formData();
    const billingOrderId = formData.get("billingOrderId") as string | null;
    const file = formData.get("file") as File | null;
    const transferredAtStr = formData.get("transferredAt") as string | null;
    const userNotes = formData.get("userNotes") as string | null;

    if (!billingOrderId) {
      return NextResponse.json({ error: "ไม่พบรหัสคำสั่งซื้อ" }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "กรุณาแนบไฟล์สลิปหลักฐานการโอนเงิน" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ขนาดไฟล์ต้องไม่เกิน 5 MB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP) หรือ PDF" },
        { status: 400 }
      );
    }

    // Verify billing order exists and belongs to user's organization
    const order = await prisma.billingOrder.findUnique({
      where: { id: billingOrderId },
      include: { organization: true },
    });

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อนี้" }, { status: 404 });
    }

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: order.organizationId,
        },
      },
    });

    if (!membership && !user.isPlatformAdmin) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ในคำสั่งซื้อนี้" }, { status: 403 });
    }

    // Ensure storage folder exists
    const storageDir = path.join(process.cwd(), "storage", "evidence");
    await fs.mkdir(storageDir, { recursive: true });

    // Generate secure random filename
    const fileExt = path.extname(file.name) || ".jpg";
    const randomHex = crypto.randomBytes(16).toString("hex");
    const safeFileName = `slip_${order.id}_${randomHex}${fileExt}`;
    const destinationPath = path.join(storageDir, safeFileName);

    // Write file buffer to storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destinationPath, buffer);

    const relativeKey = `evidence/${safeFileName}`;
    const transferredAt = transferredAtStr ? new Date(transferredAtStr) : new Date();

    // Create or update PaymentEvidence record
    const evidence = await prisma.paymentEvidence.upsert({
      where: { billingOrderId: order.id },
      create: {
        billingOrderId: order.id,
        fileKey: relativeKey,
        fileName: file.name.slice(0, 100),
        fileSize: file.size,
        mimeType: file.type,
        transferredAt,
        amountSatang: order.netAmountSatang,
        userNotes: userNotes?.trim() || null,
        uploadedByUserId: user.id,
      },
      update: {
        fileKey: relativeKey,
        fileName: file.name.slice(0, 100),
        fileSize: file.size,
        mimeType: file.type,
        transferredAt,
        userNotes: userNotes?.trim() || null,
        uploadedByUserId: user.id,
      },
    });

    // Update order status to UNDER_REVIEW
    await prisma.billingOrder.update({
      where: { id: order.id },
      data: {
        status: "UNDER_REVIEW",
      },
    });

    await logAuditEvent({
      organizationId: order.organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "PAYMENT_SLIP_UPLOADED",
      targetType: "BILLING_ORDER",
      targetId: order.id,
      details: `Uploaded payment evidence for order ${order.orderNumber} (${file.name}, ${file.size} bytes)`,
    });

    return NextResponse.json({
      success: true,
      message: "แนบหลักฐานการชำระเงินเรียบร้อยแล้ว เจ้าหน้าที่จะทำการตรวจสอบและอนุมัติโดยเร็ว",
      evidenceId: evidence.id,
    });
  } catch (err: any) {
    console.error("Upload payment slip error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดหลักฐาน" }, { status: 500 });
  }
}
