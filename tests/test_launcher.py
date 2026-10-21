"""Real loopback HTTP tests and mocked window failures; no native GUI is opened."""
import errno
import importlib.util
import io
from pathlib import Path
import socket
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('launcher', ROOT / 'launcher.py')
app = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(app)


class LauncherTests(unittest.TestCase):
    def test_unicode_path_get_head_and_denied_paths(self):
        with tempfile.TemporaryDirectory(prefix='mingli-') as tmp:
            folder = Path(tmp) / '八字 资料'
            folder.mkdir()
            (folder / app.APP_FILE).write_bytes(b'<html>synthetic</html>')
            (folder / 'private.txt').write_text('synthetic secret')
            with patch.object(app, 'app_dir', return_value=str(folder)):
                server = app.serve(0)
                base = f'http://127.0.0.1:{server.server_port}'
                try:
                    for method in ('GET', 'HEAD'):
                        with urlopen(Request(base + '/', method=method), timeout=3) as response:
                            self.assertEqual(response.status, 200)
                            self.assertEqual(response.headers['Cache-Control'], 'no-store')
                            self.assertEqual(response.read(), b'' if method == 'HEAD' else b'<html>synthetic</html>')
                        for path in ('/private.txt', '/%2e%2e/private.txt', '/launcher.py', '/%2fprivate.txt'):
                            with self.assertRaises(HTTPError) as error:
                                urlopen(Request(base + path, method=method), timeout=3)
                            self.assertEqual(error.exception.code, 404)
                            error.exception.close()
                finally:
                    server.shutdown()
                    server.server_close()

    def test_occupied_preferred_port_falls_back_without_probe_race(self):
        with socket.socket() as occupied:
            occupied.bind(('127.0.0.1', 0))
            occupied.listen()
            with patch.object(app, 'PREFERRED_PORTS', (occupied.getsockname()[1],)):
                server = app.serve_preferred()
                try:
                    self.assertNotEqual(server.server_port, occupied.getsockname()[1])
                    self.assertEqual(server.server_address[0], '127.0.0.1')
                finally:
                    server.shutdown()
                    server.server_close()

    def test_window_creation_and_browser_failure_release_bound_socket(self):
        for browser in (False, True):
            server = app.serve(0)
            port = server.server_port
            fake = types.SimpleNamespace(create_window=lambda *a, **k: (_ for _ in ()).throw(RuntimeError('synthetic')))
            argv = ['launcher.py'] + (['--browser'] if browser else [])
            with patch.object(app, 'serve_preferred', return_value=server), patch.object(sys, 'argv', argv), patch.dict(sys.modules, {'webview': fake}), patch.object(app.webbrowser, 'open', return_value=False):
                self.assertEqual(app.main(), 4)
            with socket.socket() as probe:
                self.assertNotEqual(probe.connect_ex(('127.0.0.1', port)), 0)

    def test_bind_failure_returns_actionable_exit_code(self):
        with patch.object(app, 'serve_preferred', side_effect=OSError(errno.EADDRINUSE, 'synthetic')), patch.object(sys, 'argv', ['launcher.py']):
            self.assertEqual(app.main(), 3)

    def test_english_windows_console_cannot_break_startup_cleanup(self):
        server = app.serve(0)
        port = server.server_port
        with io.TextIOWrapper(io.BytesIO(), encoding='cp1252', errors='strict') as output:
            with patch.object(sys, 'stdout', output), patch.object(sys, 'stderr', output), patch.object(sys, 'argv', ['launcher.py', '--browser']), patch.object(app, 'serve_preferred', return_value=server), patch.object(app.webbrowser, 'open', return_value=False):
                self.assertEqual(app.main(), 4)
        with socket.socket() as probe:
            self.assertNotEqual(probe.connect_ex(('127.0.0.1', port)), 0)


if __name__ == '__main__':
    unittest.main()
