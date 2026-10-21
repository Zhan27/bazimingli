#!/bin/bash
# 玄机命理排盘 - 一键同步部署（bash / macOS / Linux / WSL）
# 用法: bash sync_deploy.sh      （把 命理排盘.html 同步到 docs/index.html）
# 说明: docs/ 是 GitHub Pages 部署目录（Pages 选 main 分支 + /docs）；本地直接打开根目录的 命理排盘.html 也可
set -e
cd "$(dirname "$0")"

SRC="命理排盘.html"
DST="docs/index.html"

[ -f "$SRC" ] || { echo "✗ 找不到 $SRC"; exit 1; }
mkdir -p docs

# ---- 发布前自检：防止把 Key 写进代码 ----
HITS=0
while IFS='|' read -r NAME RE; do
  [ -z "$RE" ] && continue
  if grep -Eqn "$RE" "$SRC"; then
    echo "   - 命中：$NAME"
    grep -En "$RE" "$SRC" | head -3 | sed 's/^/     /'
    HITS=$((HITS+1))
  fi
done <<'PATTERNS'
OpenAI/DeepSeek 风格 Key|sk-[A-Za-z0-9_-]{16,}
Google API Key|AIza[0-9A-Za-z_-]{20,}
GitHub Token|gh[pousr]_[A-Za-z0-9]{20,}
Slack Token|xox[baprs]-[A-Za-z0-9-]{10,}
疑似硬编码 key 字段|key: *'[^']{16,}'
PATTERNS

if [ "$HITS" -gt 0 ]; then
  echo ""
  echo "✗ 自检未通过：源码里疑似存在硬编码密钥，已中止同步"
  echo "  请删除后重试（Key 只应由使用者在页面设置里填写）"
  exit 2
fi

cp "$SRC" "$DST"

echo "✓ 已同步  $SRC -> $DST  ($(wc -c <"$SRC" | awk '{printf "%.0f", $1/1024}') KB)"
echo "  自检通过：源码无硬编码密钥"

if command -v node >/dev/null 2>&1; then
  node -e '
const fs=require("fs");
const a=fs.readFileSync("命理排盘.html","utf8");
const b=fs.readFileSync("docs/index.html","utf8");
console.log(a===b?"  SHA 校验一致 ✓":"  ✗ 内容不一致");
' || true
fi
