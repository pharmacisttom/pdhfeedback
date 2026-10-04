# คู่มือการติดตั้งและบริหารจัดการระบบ PdhFeedback (Production Deployment Guide)

ระบบ **PdhFeedback** ออกแบบมาสำหรับติดตั้งบนเซิร์ฟเวอร์ Ubuntu Linux 22.04 / 24.04 LTS ด้วย Docker Compose และ Nginx Reverse Proxy พร้อม SSL (HTTPS)

---

## 1. ข้อกำหนดขั้นต่ำของเซิร์ฟเวอร์ (System Requirements)

- **OS:** Ubuntu 22.04 LTS หรือ 24.04 LTS (64-bit)
- **CPU:** 2 vCPU ขั้นต่ำ (แนะนำ 4 vCPU สำหรับปริมาณคำตอบสูง)
- **RAM:** 4 GB ขั้นต่ำ (แนะนำ 8 GB)
- **Disk:** 40 GB NVMe/SSD
- **Network:** Static Public IP พร้อม Domain Name ที่ชี้มายัง IP เครื่อง

---

## 2. ขั้นตอนการติดตั้งบน Ubuntu VPS

### 2.1 ติดตั้ง Docker และ Docker Compose Plugin

```bash
# อัปเดตรายการแพ็กเกจ
sudo apt update && sudo apt upgrade -y

# ติดตั้งแพ็กเกจที่จำเป็น
sudo apt install -y curl git ufw gzip

# ติดตั้ง Docker Engine ผ่าน Official Script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# ติดตั้ง Docker Compose Plugin
sudo apt install -y docker-compose-plugin

# ยืนยันการติดตั้ง
docker --version
docker compose version
```

### 2.2 โคลนซอร์สโค้ดและเตรียม Configuration

```bash
# โคลนโปรเจกต์มาที่ไดเรกทอรี /opt
sudo git clone https://github.com/your-org/pdhfeedback.git /opt/pdhfeedback
cd /opt/pdhfeedback

# สร้างไฟล์สภาพแวดล้อมจริง
cp .env.example .env

# แก้ไขความปลอดภัยในไฟล์ .env
nano .env
```

**ค่าคอนฟิกูเรชันสำคัญที่ต้องระบุใน `.env`:**
```ini
PORT=3000
NEXT_PUBLIC_APP_URL="https://feedback.yourdomain.com"
DB_ROOT_PASSWORD="<สร้างรหัสผ่านที่ซับซ้อนอย่างน้อย 24 ตัวอักษร>"
DB_PASSWORD="<สร้างรหัสผ่านฐานข้อมูลของผู้ใช้>"
AUTH_SECRET="<สร้างคีย์สุ่มด้วย openssl rand -hex 32>"
AUTH_SALT="<สร้างคีย์สุ่มด้วย openssl rand -hex 16>"
NODE_ENV="production"
```

---

## 3. การเริ่มต้นระบบด้วย Docker Compose

```bash
# Build Image และเริ่มต้นบริการ
docker compose up -d --build

# ตรวจสอบสถานะ Containers
docker compose ps

# รัน Migration ฐานข้อมูลสำหรับ Production
docker compose exec app npx prisma migrate deploy

# (ทางเลือก) สร้างข้อมูลเริ่มต้นเฉพาะครั้งแรก (Seed demo data)
docker compose exec app node scripts/seed.mjs
```

---

## 4. ติดตั้ง Nginx Reverse Proxy และ SSL (Let's Encrypt)

```bash
# ติดตั้ง Nginx และ Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# คัดลอกคอนฟิก Nginx
sudo cp nginx.conf /etc/nginx/sites-available/pdhfeedback.conf
sudo ln -s /etc/nginx/sites-available/pdhfeedback.conf /etc/nginx/sites-enabled/

# ทดสอบไวยากรณ์คอนฟิก
sudo nginx -t

# ขอใบรับรอง SSL ฟรีจาก Let's Encrypt
sudo certbot --nginx -d feedback.yourdomain.com

# รีโหลด Nginx
sudo systemctl reload nginx
```

---

## 5. การตั้งค่า Firewall (UFW) เพื่อความปลอดภัยสูงสุด

> [!IMPORTANT]
> ห้ามเปิดพอร์ต MySQL (3306) สู่สาธารณะเด็ดขาด ให้เปิดเฉพาะ SSH (22), HTTP (80) และ HTTPS (443) เท่านั้น

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 6. แผนสำรองและกู้คืนข้อมูล (Backup & Restore Procedure)

### 6.1 การสำรองข้อมูลอัตโนมัติ (Automated Daily Backup)
ตั้งค่า Cron Job ใน Ubuntu ให้สำรองข้อมูลทุกคืนเวลา 02:00 น.:
```bash
sudo crontab -e
```
เพิ่มบรรทัด:
```cron
0 2 * * * cd /opt/pdhfeedback && ./scripts/backup.sh >> /var/log/pdhfeedback_backup.log 2>&1
```

### 6.2 การกู้คืนข้อมูล (Restore Procedure)
```bash
cd /opt/pdhfeedback
chmod +x scripts/restore.sh
./scripts/restore.sh /var/backups/pdhfeedback/pdhfeedback_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

## 7. ขั้นตอนการอัปเดตระบบจาก Git อย่างปลอดภัย (Zero-Downtime Safe Upgrade)

```bash
cd /opt/pdhfeedback

# 1. สำรองฐานข้อมูลก่อนทุกครั้ง
./scripts/backup.sh

# 2. ดึงโค้ดล่าสุดจาก Git
git pull origin main

# 3. สร้าง Image ใหม่และอัปเดต Container
docker compose build app
docker compose up -d app

# 4. ตรวจสอบสถานะความพร้อม
curl -f http://127.0.0.1:3000/api/health
```

---

## 8. แผนย้อนคืนระบบ (Rollback Guide)

กรณีที่เวอร์ชันใหม่ออกแบบโครงสร้างหรือโค้ดผิดพลาด:
1. หากโค้ดทำงานผิดปกติแต่ Schema ไม่ได้เปลี่ยน:
   ```bash
   git checkout <commit_hash_ก่อนหน้า>
   docker compose up -d --build app
   ```
2. หากมีการเปลี่ยนแปลง Schema ที่ไม่เข้ากันได้ย้อนหลัง (Breaking Schema Changes):
   - ให้สลับโค้ดกลับไปเวอร์ชันเดิม
   - รันคำสั่ง `./scripts/restore.sh` เพื่อกู้คืนฐานข้อมูลก่อนหน้าการ Migration
