import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { generatePromptPayPayload, formatSatang } from "@/lib/billing";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.billingOrder.findUnique({
      where: { id: orderId },
      include: { organization: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify access
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

    // Fetch platform settings for bank info & promptpay
    const settings = await prisma.platformSetting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const promptPayId = settingsMap.get("promptpay_id") || "0105566012345";
    const promptPayName = settingsMap.get("promptpay_name") || "บจก. ทอมวิส ดิจิทัล";
    const bankName = settingsMap.get("bank_name") || "ธนาคารกสิกรไทย (KBANK)";
    const bankAccountNumber = settingsMap.get("bank_account_number") || "012-3-45678-9";
    const bankAccountName = settingsMap.get("bank_account_name") || "บจก. ทอมวิส ดิจิทัล";

    // Generate EMVCo PromptPay Payload string
    const payload = generatePromptPayPayload(promptPayId, order.netAmountSatang);

    // Generate QR Code as DataURL
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      amountSatang: order.netAmountSatang,
      amountFormatted: formatSatang(order.netAmountSatang, true),
      promptPayId,
      promptPayName,
      bankName,
      bankAccountNumber,
      bankAccountName,
      qrPayload: payload,
      qrDataUrl,
    });
  } catch (err: any) {
    console.error("Generate promptpay error:", err);
    return NextResponse.json({ error: "Failed to generate PromptPay QR" }, { status: 500 });
  }
}
