const fs = require("fs");
const path = require("path");

// CẤU HÌNH NGƯỠNG CẢNH BÁO (Số dòng)
const THRESHOLD = {
  WARNING: 200, // Màu vàng
  DANGER: 400, // Màu đỏ - Cần Refactor
};

// Các đuôi file sẽ đọc (để tránh đọc file ảnh/binary gây lỗi)
const INCLUDE_EXTS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".scss",
  ".html",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".php",
];

// Màu sắc cho Terminal
const COLORS = {
  RESET: "\x1b[0m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  GRAY: "\x1b[90m",
  BOLD: "\x1b[1m",
};

// Hàm lấy danh sách ignore từ .gitignore
function getGitIgnorePatterns(dir) {
  const gitIgnorePath = path.join(dir, ".gitignore");
  let patterns = [
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    ".vscode",
    ".idea",
  ]; // Default ignores

  if (fs.existsSync(gitIgnorePath)) {
    const content = fs.readFileSync(gitIgnorePath, "utf-8");
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
    patterns = [...patterns, ...lines];
  }
  return patterns;
}

// Kiểm tra xem file/folder có bị ignore không
function isIgnored(name, patterns) {
  // Logic đơn giản để check ignore (có thể không cover 100% cú pháp gitignore phức tạp nhưng đủ dùng)
  return patterns.some((pattern) => {
    const cleanPattern = pattern.replace(/\/$/, "").replace(/^\//, ""); // Bỏ / ở đầu cuối
    if (cleanPattern === "*") return false; // Bỏ qua wildcards quá rộng
    if (name === cleanPattern) return true;
    if (name.startsWith(cleanPattern)) return true; // Check folder
    if (pattern.startsWith("*") && name.endsWith(pattern.slice(1))) return true; // Check extension like *.log
    return false;
  });
}

// Đếm số dòng của file
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split(/\r\n|\r|\n/).length;
  } catch (e) {
    return 0;
  }
}

// Hàm format số dòng với màu sắc
function formatLOC(lines) {
  let color = COLORS.GREEN;
  if (lines > THRESHOLD.DANGER) color = COLORS.RED;
  else if (lines > THRESHOLD.WARNING) color = COLORS.YELLOW;

  return `${color}[${lines} lines]${COLORS.RESET}`;
}

// Hàm đệ quy duyệt cây thư mục
function walk(dir, prefix = "", ignorePatterns) {
  const files = fs.readdirSync(dir);

  // Sắp xếp: Folder lên đầu, sau đó đến File
  files.sort((a, b) => {
    const aPath = path.join(dir, a);
    const bPath = path.join(dir, b);
    const aIsDir = fs.statSync(aPath).isDirectory();
    const bIsDir = fs.statSync(bPath).isDirectory();
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  // Lọc các file bị ignore
  const filteredFiles = files.filter(
    (file) => !isIgnored(file, ignorePatterns)
  );

  filteredFiles.forEach((file, index) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    const isLast = index === filteredFiles.length - 1;
    const connector = isLast ? "└── " : "├── ";

    if (stats.isDirectory()) {
      console.log(
        `${prefix}${COLORS.GRAY}${connector}${COLORS.BLUE}${COLORS.BOLD}${file}/${COLORS.RESET}`
      );
      // Đệ quy
      walk(filePath, prefix + (isLast ? "    " : "│   "), ignorePatterns);
    } else {
      // Chỉ đếm dòng các file code
      const ext = path.extname(file).toLowerCase();
      let lineInfo = "";

      if (INCLUDE_EXTS.includes(ext)) {
        const lines = countLines(filePath);
        lineInfo = ` ${formatLOC(lines)}`;

        // Nếu file quá lớn, thêm cảnh báo text
        if (lines > THRESHOLD.DANGER) {
          lineInfo += ` ${COLORS.RED}⚠ REFACTOR NEEDED${COLORS.RESET}`;
        }
      }

      console.log(
        `${prefix}${COLORS.GRAY}${connector}${COLORS.RESET}${file}${lineInfo}`
      );
    }
  });
}

// --- MAIN EXECUTION ---
console.log(`${COLORS.BOLD}🔍 PROJECT STRUCTURE & LOC ANALYSIS${COLORS.RESET}`);
console.log(`Target: ${process.cwd()}`);
console.log(`Ignore: .gitignore + node_modules, .git, ...`);
console.log(`---------------------------------------------------`);

const ignorePatterns = getGitIgnorePatterns(process.cwd());
walk(process.cwd(), "", ignorePatterns);

console.log(`---------------------------------------------------`);
console.log(`${COLORS.GREEN}Done.${COLORS.RESET}`);
