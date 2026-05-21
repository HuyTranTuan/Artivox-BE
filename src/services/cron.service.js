const cron = require("node-cron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "1MemugtIg_GpqsVz2YePPmAfVX_tBLCRX";
const BACKUP_DIR = path.join(__dirname, "../../backups");

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  return google.drive({ version: "v3", auth });
}

async function dumpDatabase() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `artivox_backup_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  const { DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD } = process.env;

  return new Promise((resolve, reject) => {
    const env = { ...process.env, PGPASSWORD: DATABASE_PASSWORD };
    const cmd = `pg_dump -h ${DATABASE_HOST} -p ${DATABASE_PORT} -U ${DATABASE_USER} -d ${DATABASE_NAME} -F p -f "${filepath}"`;

    exec(cmd, { env }, (err) => {
      if (err) return reject(err);
      resolve({ filepath, filename });
    });
  });
}

async function uploadToDrive(filepath, filename) {
  const drive = getDriveClient();
  const fileStream = fs.createReadStream(filepath);

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: "application/sql",
      body: fileStream,
    },
  });

  return res.data;
}

async function runBackup() {
  console.log("[Cron] Starting DB backup...");
  try {
    const { filepath, filename } = await dumpDatabase();
    console.log(`[Cron] Dump created: ${filename}`);

    await uploadToDrive(filepath, filename);
    console.log(`[Cron] Uploaded to Google Drive: ${filename}`);

    // Cleanup local file
    fs.unlink(filepath, () => {});
  } catch (err) {
    console.error("[Cron] Backup failed:", err.message);
  }
}

function startCronJobs() {
  // Every day at 3:00 AM
  cron.schedule("0 3 * * *", runBackup, { timezone: "Asia/Ho_Chi_Minh" });
  console.log("[Cron] DB backup job scheduled: daily at 3:00 AM (ICT)");
}

module.exports = { startCronJobs, runBackup };
