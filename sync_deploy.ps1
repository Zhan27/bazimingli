# 玄机命理排盘 - 一键同步部署（Windows / PowerShell 版）
# 用法: pwsh -File sync_deploy.ps1        （在仓库根目录执行）
# 作用: 把最新的 命理排盘.html 同步到 docs/index.html，并做发布前自检
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$src = '命理排盘.html'
$dst = 'docs/index.html'

if (-not (Test-Path $src)) { Write-Host "✗ 找不到 $src" -ForegroundColor Red; exit 1 }

# ---- 发布前自检：防止把 Key 写进代码 ----
$raw = Get-Content $src -Raw -Encoding UTF8
$patterns = @(
  @{ name = 'OpenAI/DeepSeek 风格 Key'; re = 'sk-[A-Za-z0-9_\-]{16,}' },
  @{ name = 'Google API Key';            re = 'AIza[0-9A-Za-z_\-]{20,}' },
  @{ name = 'GitHub Token';              re = 'gh[pousr]_[A-Za-z0-9]{20,}' },
  @{ name = 'Slack Token';               re = 'xox[baprs]-[A-Za-z0-9\-]{10,}' },
  @{ name = '疑似硬编码 Bearer';          re = "key:\s*'[^']{16,}'" }
)
$hits = @()
foreach ($p in $patterns) {
  $m = [regex]::Matches($raw, $p.re)
  if ($m.Count -gt 0) { $hits += ("{0} × {1}（首个: {2}）" -f $p.name, $m.Count, $m[0].Value.Substring(0, [Math]::Min(12, $m[0].Value.Length)) + '…') }
}
if ($hits.Count -gt 0) {
  Write-Host "`n✗ 自检未通过：源码里疑似存在硬编码密钥，已中止同步" -ForegroundColor Red
  $hits | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
  Write-Host "   请删除后重试（Key 只应由使用者在页面设置里填写）`n" -ForegroundColor Yellow
  exit 2
}

# ---- 同步 ----
New-Item -ItemType Directory -Force -Path 'docs' | Out-Null
Copy-Item $src $dst -Force

$a = (Get-FileHash $src -Algorithm SHA256).Hash
$b = (Get-FileHash $dst -Algorithm SHA256).Hash
$sizeKB = [math]::Round((Get-Item $src).Length / 1KB)
if ($a -eq $b) {
  Write-Host "✓ 已同步  $src -> $dst   ($sizeKB KB, SHA256 $($a.Substring(0,12))…)" -ForegroundColor Green
  Write-Host "  自检通过：源码无硬编码密钥" -ForegroundColor Green
} else {
  Write-Host "✗ 同步后校验不一致，请检查" -ForegroundColor Red
  exit 3
}
