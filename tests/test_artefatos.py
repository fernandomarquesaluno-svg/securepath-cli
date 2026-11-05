"""Testes com a biblioteca padrão (unittest), sem serviços externos."""

from contextlib import redirect_stdout, redirect_stderr
from io import StringIO
from pathlib import Path
import os
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from artefatos import Summary, main, scan_file


class SecurePathTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def run_cli(self, *args):
        out, err = StringIO(), StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = main([str(arg) for arg in args])
        return code, out.getvalue(), err.getvalue()

    def test_detects_five_synthetic_findings_without_revealing_values(self):
        source = Path(__file__).resolve().parents[1] / "teste.txt"
        code, output, error = self.run_cli(source, "--fail-on-findings")
        self.assertEqual(code, 1)
        self.assertEqual(output.count("[ALERTA]"), 5)
        self.assertIn("alertas=5", output)
        self.assertNotIn("senha_ficticia_nao_utilizar", output)
        self.assertNotIn("AKIA0000000000000000", output)
        self.assertEqual(error, "")

    def test_clean_file_has_no_alerts(self):
        clean = self.root / "limpo.txt"
        clean.write_text("status = 'ok'\n", encoding="utf-8")
        code, output, _ = self.run_cli(clean, "--fail-on-findings")
        self.assertEqual(code, 0)
        self.assertIn("alertas=0", output)

    @unittest.skipUnless(hasattr(os, "mkfifo"), "FIFO requer POSIX")
    def test_fifo_does_not_block_directory_scan(self):
        os.mkfifo(self.root / "pipe")
        scanner = Path(__file__).resolve().parents[1] / "artefatos.py"
        result = subprocess.run(
            [sys.executable, str(scanner), str(self.root)],
            capture_output=True, text=True, timeout=3,
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn("ignorados=1", result.stdout)

    def test_symlink_is_skipped_without_reading_target(self):
        target = self.root / "target.txt"
        target.write_text("password = 'synthetic'", encoding="utf-8")
        link = self.root / "alias.txt"
        try:
            link.symlink_to(target)
        except (OSError, NotImplementedError):
            self.skipTest("links simbólicos indisponíveis")
        summary = Summary()
        with redirect_stdout(StringIO()) as output:
            scan_file(link, summary, 1024)
        self.assertEqual(summary.skipped, 1)
        self.assertEqual(summary.findings, 0)
        self.assertEqual(output.getvalue(), "")

    def test_binary_file_is_skipped(self):
        binary = self.root / "binario.bin"
        binary.write_bytes(b"abc\x00AKIA0000000000000000")
        code, output, _ = self.run_cli(binary)
        self.assertEqual(code, 0)
        self.assertIn("ignorados=1", output)
        self.assertIn("alertas=0", output)

    def test_non_utf8_file_does_not_crash(self):
        damaged = self.root / "nao_utf8.txt"
        damaged.write_bytes(b"\xff\xfe\xfa\npassword = 'teste'\n")
        code, output, _ = self.run_cli(damaged)
        self.assertEqual(code, 0)
        self.assertIn("alertas=1", output)

    def test_large_file_is_skipped(self):
        large = self.root / "grande.txt"
        large.write_text("x" * 1025, encoding="utf-8")
        code, output, _ = self.run_cli(large, "--max-size-kib", "1")
        self.assertEqual(code, 0)
        self.assertIn("ignorados=1", output)

    def test_directory_scan_ignores_git_folder(self):
        hidden = self.root / ".git"
        hidden.mkdir()
        (hidden / "fake.txt").write_text("password = 'oculto'", encoding="utf-8")
        (self.root / "safe.txt").write_text("no secrets", encoding="utf-8")
        code, output, _ = self.run_cli(self.root)
        self.assertEqual(code, 0)
        self.assertIn("alertas=0", output)
        self.assertIn("arquivos analisados=1", output)

    def test_permission_error_does_not_abort_scan(self):
        file = self.root / "blocked.txt"
        file.write_text("content", encoding="utf-8")
        summary = Summary()
        with patch.object(Path, "open", side_effect=PermissionError(13, "Permission denied")):
            with redirect_stderr(StringIO()):
                scan_file(file, summary, 1024)
        self.assertEqual(summary.errors, 1)
        self.assertEqual(summary.findings, 0)

    def test_unavailable_path_returns_argument_error(self):
        with redirect_stderr(StringIO()):
            with self.assertRaises(SystemExit) as captured:
                main([str(self.root / "missing")])
        self.assertEqual(captured.exception.code, 2)

    def test_directory_io_error_is_reported_and_scan_continues(self):
        root = self.root
        def broken_walk(*args, **kwargs):
            callback = kwargs["onerror"]
            callback(PermissionError(13, "Permission denied", str(root / "subdir")))
            yield (str(root), [], ["valid.txt"])
        (root / "valid.txt").write_text("password = 'fake'", encoding="utf-8")
        with patch("artefatos.os.walk", side_effect=broken_walk):
            code, out, err = self.run_cli(root)
        self.assertEqual(code, 2)
        self.assertIn("alertas=1", out)
        self.assertIn("erros de I/O=1", out)
        self.assertIn("[ERRO]", err)


if __name__ == "__main__":
    unittest.main()

