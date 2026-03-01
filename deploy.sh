#!/bin/bash
# ============================================================
# 云途物流 SaaS 管理平台 - 安全部署脚本
# 
# 【重要】本脚本只更新物流系统文件，绝对不会影响以下目录：
#   - /var/www/html/windows/   （门窗设计软件）
#   - /var/www/windoor/        （门窗设计软件备份）
#
# 使用方法：bash deploy.sh
# ============================================================

set -e

SERVER="8.140.238.44"
SERVER_USER="root"
DEPLOY_DIR="/var/www/html"
BACKEND_JAR_PATH="/root/logistics/backend/logistics-1.0.0.jar"
BACKEND_SERVICE="logistics-backend"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# 第一步：本地构建前端
# ============================================================
log_info "开始构建前端..."
cd "$(dirname "$0")/frontend"
pnpm install --frozen-lockfile
pnpm run build
log_info "前端构建完成"

# 找到构建产物目录
FRONTEND_DIST=""
if [ -d "dist/public" ]; then
    FRONTEND_DIST="dist/public"
elif [ -d "dist" ]; then
    FRONTEND_DIST="dist"
else
    log_error "找不到前端构建产物目录"
    exit 1
fi
log_info "前端构建产物目录: frontend/$FRONTEND_DIST"

# ============================================================
# 第二步：本地构建后端
# ============================================================
log_info "开始构建后端..."
cd "$(dirname "$0")/backend"
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
mvn clean package -DskipTests -q
JAR_FILE=$(ls target/logistics-*.jar 2>/dev/null | head -1)
if [ -z "$JAR_FILE" ]; then
    log_error "找不到后端 JAR 文件"
    exit 1
fi
log_info "后端构建完成: $JAR_FILE"

# ============================================================
# 第三步：打包（只打包物流系统文件）
# ============================================================
log_info "打包部署文件..."
cd "$(dirname "$0")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE="/tmp/logistics_deploy_${TIMESTAMP}.tar.gz"

# 只打包前端构建产物（不包含 windows 子目录）
tar czf "$PACKAGE" \
    -C "frontend/$FRONTEND_DIST" \
    --exclude="windows" \
    --exclude="windoor" \
    . 2>/dev/null

log_info "前端包大小: $(du -sh $PACKAGE | cut -f1)"

# ============================================================
# 第四步：传输到服务器
# ============================================================
log_info "传输文件到服务器..."
scp -o StrictHostKeyChecking=no "$PACKAGE" "${SERVER_USER}@${SERVER}:/tmp/"
scp -o StrictHostKeyChecking=no "$JAR_FILE" "${SERVER_USER}@${SERVER}:/tmp/logistics-new.jar"
log_info "文件传输完成"

# ============================================================
# 第五步：在服务器上安全部署（精确替换，保护 windows 目录）
# ============================================================
log_info "在服务器上执行安全部署..."
ssh -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER}" bash << REMOTE_SCRIPT
set -e

DEPLOY_DIR="$DEPLOY_DIR"
PACKAGE_FILE="/tmp/$(basename $PACKAGE)"
TIMESTAMP="$TIMESTAMP"

echo "[SERVER] 开始安全部署..."

# ---- 保护检查：确认 windows 目录存在 ----
if [ -d "\${DEPLOY_DIR}/windows" ]; then
    echo "[SERVER] ✅ windows 目录存在，将被保护"
    WINDOWS_BACKUP="/tmp/windows_backup_\${TIMESTAMP}"
    cp -r "\${DEPLOY_DIR}/windows" "\${WINDOWS_BACKUP}"
    echo "[SERVER] ✅ windows 目录已备份到 \${WINDOWS_BACKUP}"
else
    echo "[SERVER] ⚠️  windows 目录不存在，跳过备份"
fi

# ---- 只删除物流系统文件（保留 windows 子目录）----
echo "[SERVER] 清理旧版物流系统文件..."
find "\${DEPLOY_DIR}" -maxdepth 1 -not -name "windows" -not -name "windoor" -not -name "." -delete 2>/dev/null || true
rm -rf "\${DEPLOY_DIR}/assets" "\${DEPLOY_DIR}/__manus__" 2>/dev/null || true

# ---- 解压新版物流系统文件 ----
echo "[SERVER] 解压新版物流系统文件..."
tar xzf "\${PACKAGE_FILE}" -C "\${DEPLOY_DIR}/"

# ---- 验证 windows 目录完整性 ----
if [ -d "\${DEPLOY_DIR}/windows" ]; then
    echo "[SERVER] ✅ windows 目录完整，未受影响"
else
    echo "[SERVER] ❌ windows 目录丢失！正在从备份恢复..."
    cp -r "\${WINDOWS_BACKUP}" "\${DEPLOY_DIR}/windows"
    echo "[SERVER] ✅ windows 目录已从备份恢复"
fi

# ---- 部署后端 JAR ----
echo "[SERVER] 部署后端 JAR..."
cp /tmp/logistics-new.jar "$BACKEND_JAR_PATH"
systemctl restart "$BACKEND_SERVICE"
echo "[SERVER] 后端服务重启中..."

# ---- 重载 Nginx ----
nginx -t && systemctl reload nginx
echo "[SERVER] Nginx 已重载"

# ---- 清理临时文件 ----
rm -f "\${PACKAGE_FILE}" /tmp/logistics-new.jar

echo "[SERVER] ✅ 部署完成！"
echo "[SERVER] 物流系统: http://$SERVER/"
echo "[SERVER] 门窗设计: http://$SERVER/windows/"
REMOTE_SCRIPT

log_info "============================================"
log_info "✅ 部署成功！"
log_info "物流系统: http://${SERVER}/"
log_info "门窗设计: http://${SERVER}/windows/ （未受影响）"
log_info "============================================"
