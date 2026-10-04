# คู่มือการเชื่อมต่อเว็บไซต์และ REST API (Tomvisfeedback Integration Guide)

Tomvisfeedback รองรับการนำแบบประเมินความพึงพอใจการบริการ (1–5 ดาว, NPS 0–10, แบบเลือกตอบ และข้อเสนอแนะ) ไปเชื่อมต่อกับเว็บไซต์ของโรงพยาบาล คลินิก ร้านค้า หรือระบบสารสนเทศภายใน (HIS, CRM, POS, Queue System) ได้อย่างยืดหยุ่น ปลอดภัย และแยกสิทธิ์ผู้ใช้อย่างรัดกุม (Multi-tenant RBAC)

---

## 1. ช่องทางการนำไปใช้งาน (4 รูปแบบ)

| ช่องทาง | รูปแบบ | เหมาะสำหรับ | ความต้องการระบบ |
| :--- | :--- | :--- | :--- |
| **A. Public Link & QR Code** | เปิดแบบประเมินเต็มหน้าจอเบราว์เซอร์ | ตั้งป้ายหน้าเคาน์เตอร์, สแกน QR ท้ายใบเสร็จ | ผู้ใช้สแกนผ่านสมาร์ตโฟน |
| **B. Inline iframe** | ฝังแบบประเมินเป็นส่วนหนึ่งของหน้าเว็บ | หน้าสรุปผลบริการ, เว็บไซต์หลักองค์กร | รองรับ HTML `<iframe>` |
| **C. JavaScript Widget** | กล่องประเมินหรือปุ่ม Pop-up Dialog | เว็บพอร์ทัล, ระบบตรวจสอบผลแล็บ | ติดตั้งแท็ก `<script>` และ `<div>` |
| **D. Server-to-Server API** | REST API สร้างคำเชิญหรือดึงรายงานสรุป | ระบบ HIS, CRM, Queue, ระบบหลังบ้าน | HTTP Client พร้อม Bearer API Key |

---

## 2. ศูนย์รวมการเชื่อมต่อ (Integration Center)

ผู้ดูแลระบบองค์กร (Owner / Admin) สามารถเข้าจัดการได้ที่เมนู **"เชื่อมต่อเว็บไซต์ & API"** (`/[orgSlug]/integrations`):

1. **เลือกแบบประเมินและจุดบริการ**: ระบุแบบประเมินที่ Publish แล้ว และจุดบริการที่ต้องการผูก
2. **ตั้งค่า Allowed Website Origins**: ระบุโดเมนของเว็บไซต์ภายนอกที่จะนำโค้ดไปฝัง (เช่น `https://hospital.th`)
3. **Live Responsive Preview**: ทดสอบการแสดงผลบนขนาดหน้าจอ 360px (Mobile S), 390px (iPhone), 768px (Tablet), และ 1440px (Desktop)
4. **คัดลอก Code Snippet**: คัดลอกโค้ด Inline iframe หรือ JS Widget พร้อมใช้งาน
5. **จัดการ API Keys**: สร้าง API Key พร้อมกำหนด Scope และหมุนเวียน (Rotate) หรือเพิกถอน (Revoke) ได้ทันที

---

## 3. การฝังบนเว็บไซต์ (Embedding)

### A. โค้ด Inline iframe

คัดลอกโค้ดนี้ไปวางในจุดที่ต้องการให้แบบประเมินแสดงผล:

```html
<iframe
  src="{APP_BASE_URL}/embed/{PUBLICATION_ID}"
  title="ประเมินความพึงพอใจในการรับบริการ"
  loading="lazy"
  referrerpolicy="strict-origin"
  style="width: 100%; min-height: 520px; border: 0; border-radius: 12px; overflow: hidden;"
  allow="clipboard-write">
</iframe>
```

### B. โค้ด JavaScript Widget (Inline หรือ Dialog Button)

#### แบบที่ 1: Inline Widget
```html
<div data-pdhfeedback-widget="{PUBLICATION_ID}" data-mode="inline">
  <!-- ลิงก์สำรอง (Fallback) หาก JavaScript ไม่ทำงาน -->
  <p>หากแบบประเมินไม่แสดงผล <a href="{APP_BASE_URL}/embed/{PUBLICATION_ID}" target="_blank" rel="noopener">คลิกที่นี่เพื่อประเมินความพึงพอใจ</a></p>
</div>
<script
  src="{APP_BASE_URL}/widget/v1.js"
  data-pdhfeedback-embed="{PUBLICATION_ID}"
  defer>
</script>
```

#### แบบที่ 2: Floating / Fixed Dialog Button
```html
<div
  data-pdhfeedback-widget="{PUBLICATION_ID}"
  data-mode="dialog"
  data-button-text="ประเมินความพึงพอใจ"
  data-button-position="bottom-right">
</div>
<script
  src="{APP_BASE_URL}/widget/v1.js"
  data-pdhfeedback-embed="{PUBLICATION_ID}"
  defer>
</script>
```

### คุณสมบัติความปลอดภัยของ Widget:
- **Idempotent Initialization**: เรียกสคริปต์ซ้ำหลายครั้งจะไม่สร้าง iframe ซ้อนกัน
- **Multiple Widgets**: รองรับการวาง widget หลายตัวในหน้าเดียวกันได้อย่างอิสระ
- **Zero Host Mutation**: ไม่แทรกหรือแก้ไข Global CSS ของเว็บไซต์เจ้าบ้าน
- **No Third-party Cookies**: ผู้ใช้สามารถส่งผลประเมินได้โดยไม่ต้องพึ่งพา 3rd-party cookie
- **Accessible Modal Dialog**: กด `Esc` เพื่อปิด, Trap Focus ภายใน Modal, และคืน Focus ไปยังปุ่มเปิดเมื่อปิด Modal

---

## 4. มาตรการความปลอดภัยและ CSP (Security & CSP)

### การตรวจสอบ Allowed Origins
ระบบ PdhFeedback กำหนดนโยบายความปลอดภัยแบบ **Exact Match Origin**:
- ต้องระบุ **Scheme + Hostname + Port** ชัดเจน เช่น `https://myhospital.com` หรือ `https://portal.clinic.th:8443`
- **ไม่อนุญาต** Wildcard (`*`), Suffix match, หรือ Path (`/page`)
- ในระบบ Production รองรับเฉพาะ **HTTPS** (ยกเว้น `http://localhost` ใน Development)

### Content Security Policy (CSP) `frame-ancestors`
หน้า `/embed/{publicationId}` จะส่ง HTTP Header เพื่อป้องกัน Clickjacking:
```http
Content-Security-Policy: frame-ancestors 'self' https://myhospital.com https://portal.clinic.th;
X-Frame-Options: SAMEORIGIN
```
> **หมายเหตุ:** หน้า Admin (`/[orgSlug]/*`) และหน้าจัดการของระบบจะถูกตั้งค่าห้ามฝังใน iframe โดยเด็ดขาด (`frame-ancestors 'none'`)

---

## 5. การสื่อสารผ่าน postMessage (Parent-Child Communication)

Widget สื่อสารระหว่างเว็บไซต์เจ้าบ้านกับ iframe ผ่าน `window.postMessage` โดยมีข้อกำหนด:
1. ตรวจสอบ `event.origin` แบบ Exact Match ทุกครั้ง
2. ตรวจสอบ `event.source` ตรงกับ Window ของ iframe
3. ไม่ส่งคะแนน ความคิดเห็น ข้อมูลติดต่อ หรือรหัสคนไข้ผ่าน event

### ตัวอย่าง Event Listener บนเว็บไซต์เจ้าบ้าน:
```javascript
window.addEventListener("message", function (event) {
  // 1. ตรวจสอบ Origin ของ PdhFeedback อย่างเคร่งครัด
  const expectedOrigin = "https://feedback.yourdomain.com"; // แทนที่ด้วย Base URL ของระบบ
  if (event.origin !== expectedOrigin) return;

  const data = event.data;
  if (!data || !data.type || !data.type.startsWith("pdhfeedback:")) return;

  switch (data.type) {
    case "pdhfeedback:ready":
      console.log("แบบประเมินโหลดพร้อมใช้งาน:", data.publicationId);
      break;

    case "pdhfeedback:resize":
      // ปรับความสูงอัตโนมัติ (จำกัดช่วง 320px - 1400px เพื่อความปลอดภัย)
      const clampedHeight = Math.min(Math.max(data.height, 320), 1400);
      const iframe = document.querySelector(`iframe[src*="${data.publicationId}"]`);
      if (iframe) {
        iframe.style.height = clampedHeight + "px";
      }
      break;

    case "pdhfeedback:submitted":
      // แจ้งเตือนเมื่อผู้รับบริการส่งคำตอบเรียบร้อย (ไม่ส่งข้อมูลส่วนบุคคล)
      console.log("ผู้รับบริการทำแบบประเมินเรียบร้อยแล้ว");
      // สามารถสั่งปิด dialog หรือแสดงข้อความขอบคุณเพิ่มเติมได้ที่นี่
      break;

    case "pdhfeedback:close":
      console.log("ผู้รับบริการกดปิดแบบประเมิน");
      break;
  }
});
```

---

## 6. Server-to-Server REST API (`/api/v1`)

### การยืนยันตัวตน (Authentication)
ส่ง API Key ผ่าน Header:
```http
Authorization: Bearer pdh_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

### รายการ API Scopes:
- `service_points:read`: ดึงรายชื่อจุดบริการ
- `surveys:read`: ดึงโครงสร้างแบบประเมินและคำถาม
- `invitations:write`: สร้าง One-time Survey Invitation เชื่อมกับคิวบริการ
- `reports:read`: ดึงรายงานสถิติสรุป (CSAT, NPS, คะแนนเฉลี่ย)
- `usage:read`: ตรวจสอบโควตาและการใช้งานประจำเดือน

---

### Endpoints สำคัญ

#### 1. สร้าง Survey Invitation เฉพาะคิวรับบริการ (One-time Invitation)
`POST /api/v1/invitations`
- **Headers**:
  - `Authorization: Bearer <API_KEY>`
  - `Idempotency-Key: <UUID>` (ป้องกันการสร้างซ้ำหากเครือข่ายขัดข้อง)
- **Request Body**:
```json
{
  "publicationId": "pub_live_abc123",
  "servicePointId": "sp_opd_01",
  "expiresInDays": 3,
  "externalReference": "VISIT-2026-98124"
}
```
> **คำเตือนความปลอดภัย:** `externalReference` ต้องเป็นรหัสอ้างอิงภายในแบบสุ่ม (Opaque Reference) **ห้าม** ใส่เลขบัตรประชาชน, เลข HN, ชื่อ-นามสกุล หรือเบอร์โทรศัพท์

- **Response (201 Created)**:
```json
{
  "success": true,
  "invitationId": "inv_xyz789",
  "invitationUrl": "https://feedback.yourdomain.com/s/pub_live_abc123?inv=inv_xyz789",
  "expiresAt": "2026-10-07T12:00:00.000Z"
}
```

---

#### 2. ดึงรายงานสรุปผลประเมิน (Aggregate Summary)
`GET /api/v1/reports/summary?range=30d`
- **Response (200 OK)**:
```json
{
  "success": true,
  "metrics": {
    "totalResponses": 1250,
    "csat": 94.5,
    "averageScore": 4.72,
    "nps": 78
  },
  "period": {
    "range": "30d",
    "startDate": "2026-09-04T00:00:00.000Z",
    "endDate": "2026-10-04T23:59:59.000Z",
    "timezone": "Asia/Bangkok (UTC+07:00)"
  }
}
```

---

#### 3. ดึงสัดส่วนการให้คะแนนดาว 1–5 ดวง
`GET /api/v1/reports/ratings?range=30d`
- **Response (200 OK)**:
```json
{
  "success": true,
  "totalResponses": 1250,
  "ratedResponses": 1250,
  "ratingBreakdown": [
    { "stars": 5, "count": 950, "percentage": 76.0 },
    { "stars": 4, "count": 230, "percentage": 18.4 },
    { "stars": 3, "count": 50, "percentage": 4.0 },
    { "stars": 2, "count": 15, "percentage": 1.2 },
    { "stars": 1, "count": 5, "percentage": 0.4 }
  ]
}
```

---

## 7. ตัวอย่างการเรียกใช้งาน Server-to-Server (Code Examples)

### A. Node.js (Fetch API)
```javascript
// his-survey-service.js
import crypto from "crypto";

async function createSurveyInvitation(visitId, servicePointId) {
  const apiKey = process.env.PDHFEEDBACK_API_KEY;
  const baseUrl = process.env.PDHFEEDBACK_BASE_URL || "https://feedback.yourdomain.com";

  const response = await fetch(`${baseUrl}/api/v1/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      publicationId: "pub_opd_registration",
      servicePointId,
      expiresInDays: 3,
      externalReference: visitId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create invitation: ${errorData.error?.message}`);
  }

  const data = await response.json();
  return data.invitationUrl;
}
```

### B. PHP (cURL)
```php
<?php
// his_create_invitation.php

function createPdhInvitation($visitId, $servicePointId) {
    $apiKey = getenv('PDHFEEDBACK_API_KEY');
    $baseUrl = getenv('PDHFEEDBACK_BASE_URL') ?: 'https://feedback.yourdomain.com';
    $idempotencyKey = bin2hex(random_bytes(16));

    $payload = json_encode([
        'publicationId' => 'pub_pharmacy_dispensary',
        'servicePointId' => $servicePointId,
        'expiresInDays' => 3,
        'externalReference' => $visitId,
    ]);

    $ch = curl_init("{$baseUrl}/api/v1/invitations");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
        'Idempotency-Key: ' . $idempotencyKey,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $result = json_decode($response, true);
        return $result['invitationUrl'];
    } else {
        error_log("PdhFeedback error: " . $response);
        return null;
    }
}
```

### C. cURL CLI
```bash
export PDH_KEY="pdh_live_xxxxxxxxxxxxxxxxxxxxxxxx"

# ดึงข้อมูลรายงานสรุปผล
curl -X GET "https://feedback.yourdomain.com/api/v1/reports/summary?range=30d" \
  -H "Authorization: Bearer $PDH_KEY"
```

---

## 8. การเปิดสิทธิ์ใช้งาน (Entitlements) และสถานะ Billing

- ฟีเจอร์ **Embeddable Survey Widget** และ **REST API Access** มีการตรวจสอบสิทธิ์ฝั่ง Server (Server-side Entitlement Check)
- ในโหมดเริ่มต้นของระบบ (`BILLING_MODE=disabled`):
  - **ไม่มีการเรียกเก็บเงินจริงหรือหน้าชำระเงิน**
  - ผู้ดูแลระบบส่วนกลาง (Platform Super Admin) สามารถมอบสิทธิ์ผ่านระบบ **Administrative Access Grant** ให้กับองค์กรที่ต้องการทดลองใช้งานได้ทันที
  - สามารถตรวจสอบสิทธิ์และโควตาคงเหลือได้ผ่าน `GET /api/v1/usage`
