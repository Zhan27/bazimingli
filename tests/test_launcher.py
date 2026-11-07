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
from unittest.mock import Mock, patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('launcher', ROOT / 'launcher.py')
app = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(app)


class LauncherTests(unittest.TestCase):
    def test_private_mode_rejects_browser_override_before_binding(self):
        with patch.object(sys, 'argv', ['launcher.py', '--private', '--browser']), patch.object(app, 'serve_preferred') as serve, patch.object(app.webbrowser, 'open', return_value=False) as browser:
            self.assertEqual(app.main(), 5)
        serve.assert_not_called()
        browser.assert_not_called()

    def test_private_mode_never_falls_back_to_a_persistent_browser(self):
        server = Mock(server_port=app.PREFERRED_PORTS[0])
        with patch.object(sys, 'argv', ['launcher.py', '--private']), patch.object(app, 'serve_preferred', return_value=server), patch.dict(sys.modules, {'webview': None}), patch.object(app.webbrowser, 'open', return_value=False) as browser:
            self.assertEqual(app.main(), 5)
        browser.assert_not_called()
        server.shutdown.assert_called_once()
        server.server_close.assert_called_once()

    def test_native_window_uses_isolated_storage_and_explicit_private_mode(self):
        with tempfile.TemporaryDirectory(prefix='mingli-profile-') as folder:
            for private in (False, True):
                with self.subTest(private=private):
                    fake = types.SimpleNamespace(settings={}, create_window=Mock(), start=Mock())
                    server = Mock(server_port=app.PREFERRED_PORTS[0])
                    argv = ['launcher.py'] + (['--private'] if private else [])
                    with patch.object(app, 'serve_preferred', return_value=server), patch.object(sys, 'argv', argv), patch.dict(sys.modules, {'webview': fake}), patch.dict(app.os.environ, {'LOCALAPPDATA': folder}):
                        self.assertEqual(app.main(), 0)
                    path = None if private else str(Path(folder) / 'MingliPaipan' / 'WebView')
                    fake.start.assert_called_once_with(private_mode=private, storage_path=path)
                    self.assertIs(fake.settings['ALLOW_DOWNLOADS'], True)
                    server.shutdown.assert_called_once()
                    server.server_close.assert_called_once()

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

    def test_fallback_port_is_reported_to_the_workbench(self):
        fake = types.SimpleNamespace(settings={}, create_window=Mock(), start=Mock())
        server = Mock(server_port=app.PREFERRED_PORTS[0]+1)
        with patch.object(app, 'serve_preferred', return_value=server), patch.object(sys, 'argv', ['launcher.py', '--private']), patch.dict(sys.modules, {'webview': fake}):
            self.assertEqual(app.main(), 0)
        url = fake.create_window.call_args.args[1]
        self.assertTrue(url.endswith('?desktop_port_fallback=1'), url)

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
