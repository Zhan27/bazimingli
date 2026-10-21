#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
玄机命理排盘 · 桌面版启动器
======================================================================
用 pywebview 把单文件应用装进一个原生窗口，双击即用，不依赖外部浏览器。

设计要点
--------
1. 不用 file:// 直接加载，而是起一个**本机回环 HTTP 服务**。
   原因：file:// 是不透明源（opaque origin），WebView2 下的 localStorage
   写入不稳定，用户会丢排盘记录和 AI 配置。用固定端口的 http://127.0.0.1:8765
   让源（origin）在每次启动时保持一致，localStorage 才能稳定留存。
2. 端口优先固定 8765，被占用时顺延 8766~8769，全被占用才随机。
   随机端口会导致 origin 变化 → 等同于换设备，记录读不到。
3. 仅监听 127.0.0.1，不对外暴露；只服务应用目录内的静态文件。
4. 找不到 pywebview 时自动降级：用系统默认浏览器打开同一地址。

打包
----
    python -m venv venv
    venv\\Scripts\\pip install pywebview pyinstaller
    venv\\Scripts\\pyinstaller --onefile --noconsole --name 命理排盘 ^
        --add-data "命理排盘.html;." launcher.py

⚠️ 注意：--onefile 打出的 exe 只是把 HTML 一起塞进包体，
  用 pyinstxtractor 之类工具几分钟就能把 命理排盘.html 完整提出来。
  exe **不构成任何源码保护**。真实 Key 千万不要写进 HTML 或 exe，
  需要内置 Key 请走 worker/ 里的中转服务。
======================================================================
"""
import os
import errno
import sys
import threading
import webbrowser
import hashlib
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

APP_TITLE = "玄机命理排盘 · 八字紫微奇门六爻"
APP_FILE = "命理排盘.html"
PREFERRED_PORTS = (8765, 8766, 8767, 8768, 8769)


def app_dir() -> str:
    """PyInstaller 解包目录，或脚本所在目录。"""
    base = getattr(sys, "_MEIPASS", None)
    if base:
        return base
    return os.path.dirname(os.path.abspath(__file__))


class AppHandler(SimpleHTTPRequestHandler):
    """只服务主 HTML 本身；其余路径一律 404（不暴露启动器源码或目录内其它文件）。"""

    def translate_path(self, path):  # noqa: N802 (stdlib 命名)
        p = unquote(urlparse(path).path)
        if p in ("", "/", "/" + APP_FILE):
            return os.path.join(app_dir(), APP_FILE)
        return ""  # 交给 send_head 判定为不存在

    def send_head(self):
        if not self.translate_path(self.path):
            self.send_error(404, "Not Found")
            return None
        return super().send_head()

    def log_message(self, fmt, *args):  # 静默，避免控制台被刷
        pass

    def end_headers(self):
        # 开发期避免缓存住旧版 HTML
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()


def serve(port: int) -> ThreadingHTTPServer:
    handler = partial(AppHandler, directory=app_dir())
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    httpd.daemon_threads = True
    try:
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
    except BaseException:
        httpd.server_close()
        raise
    return httpd


def serve_preferred() -> ThreadingHTTPServer:
    """Bind directly; do not release a probe socket before the real bind."""
    for port in (*PREFERRED_PORTS, 0):
        try:
            return serve(port)
        except OSError as exc:
            if port == 0 or exc.errno not in (errno.EADDRINUSE, errno.EACCES):
                raise
    raise OSError("无法绑定本地服务端口")


def main() -> int:
    html_path = os.path.join(app_dir(), APP_FILE)
    if not os.path.isfile(html_path):
        print(f"[×] 找不到 {APP_FILE}，请确认它与启动器在同一目录。", file=sys.stderr)
        return 1

    if '--self-test' in sys.argv:
        from urllib.request import urlopen
        server = serve(0)
        try:
            with open(html_path, 'rb') as source:
                expected = hashlib.sha256(source.read()).digest()
            with urlopen(f'http://127.0.0.1:{server.server_port}/', timeout=10) as response:
                return 0 if server.server_address[0] == '127.0.0.1' and hashlib.sha256(response.read()).digest() == expected else 2
        finally:
            server.shutdown()
            server.server_close()

    force_browser = "--browser" in sys.argv
    try:
        httpd = serve_preferred()
    except OSError:
        print("[×] 无法启动本地服务，请检查端口权限。", file=sys.stderr)
        return 3
    port = httpd.server_port
    url = f"http://127.0.0.1:{port}/{APP_FILE}"

    print(f"[·] 本地服务: http://127.0.0.1:{port}/")
    print(f"[·] 应用目录: {app_dir()}")
    if port != PREFERRED_PORTS[0]:
        print("[!] 首选端口被占用，已换端口；不同端口的浏览器记录独立，请勿误以为旧记录已删除。")

    try:
        if not force_browser:
            try:
                import webview
            except ImportError:
                print("[!] 未安装 pywebview，降级为系统浏览器打开。")
            else:
                webview.create_window(APP_TITLE, url, width=1180, height=880,
                                      min_size=(900, 640), text_select=True)
                webview.start()
                return 0
        if not webbrowser.open(url):
            print("[×] 无法打开系统浏览器。", file=sys.stderr)
            return 4
        print("[·] 已在默认浏览器中打开。按 Ctrl+C 结束服务。")
        threading.Event().wait()
    except KeyboardInterrupt:
        pass
    except Exception:
        print("[×] 窗口启动失败，本地服务已关闭。", file=sys.stderr)
        return 4
    finally:
        httpd.shutdown()
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
