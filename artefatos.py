#!/usr/bin/env python3
"""SecurePath CLI: varredura local e heurística de possíveis segredos.

Somente biblioteca padrão. Nenhum conteúdo de segredo é exibido.
"""

import argparse
from dataclasses import dataclass, field
import json
import os
from pathlib import Path
import re
import stat
import sys


@dataclass(frozen=True)
class Rule:
    rule_id: str
    category: str
    pattern: re.Pattern


# Expressões heurísticas indicam padrões, não a autenticidade das credenciais.
RULES = (
    Rule("SEC001", "AWS Access Key ID", re.compile(r"\bAKIA[A-Z0-9]{16}\b")),
    Rule("SEC002", "Bearer token", re.compile(r"\bBearer\s+[A-Za-z0-9._~+/-]{20,}", re.IGNORECASE)),
    Rule("SEC003", "Cabeçalho de chave RSA privada", re.compile(r"-----BEGIN RSA PRIVATE KEY-----")),
    Rule("SEC004", "Senha/segredo atribuído", re.compile(
        r"\b(?:[A-Za-z_][A-Za-z0-9_]*_)?(?:password|passwd|pwd|secret)"
        r"\s*=\s*(['\"])[^'\"\r\n]+\1", re.IGNORECASE)),
    Rule("SEC005", "AWS Temporary Access Key ID", re.compile(r"\bASIA[A-Z0-9]{16}\b")),
    Rule("SEC006", "GitHub personal access token (clássico)", re.compile(r"\bghp_[A-Za-z0-9]{36}\b")),
    Rule("SEC007", "Cabeçalho de chave privada PEM/OpenSSH", re.compile(
        r"-----BEGIN (?:EC |OPENSSH )?PRIVATE KEY-----")),
)
PATTERNS = {rule.category: rule.pattern for rule in RULES}

IGNORED_DIRS = frozenset({
    ".git", ".venv", "venv", "__pycache__", ".pytest_cache",
    "node_modules", "dist", "build",
})
DEFAULT_MAX_SIZE_KIB = 5120  # 5 MiB


@dataclass(frozen=True)
class Finding:
    rule_id: str
    category: str
    path: str
    line: int

    def to_dict(self) -> dict:
        return {
            "rule_id": self.rule_id,
            "category": self.category,
            "path": self.path,
            "line": self.line,
        }


@dataclass
class Summary:
    examined: int = 0
    skipped: int = 0
    errors: int = 0
    findings: int = 0
    output_format: str = "text"
    records: list[Finding] = field(default_factory=list)


def report_error(path: Path, exc: OSError, summary: Summary) -> None:
    summary.errors += 1
    print(f"[ERRO] Não foi possível acessar {path}: {exc.strerror or exc}", file=sys.stderr)


def scan_file(path: Path, summary: Summary, max_bytes: int) -> None:
    """Analisa um arquivo por linhas e continua apesar de erros locais de I/O."""
    try:
        if path.is_symlink():
            summary.skipped += 1
            return
        file_stat = path.stat()
        # FIFOs, sockets e dispositivos podem bloquear ou produzir fluxos ilimitados.
        if not stat.S_ISREG(file_stat.st_mode) or file_stat.st_size > max_bytes:
            summary.skipped += 1
            return
        # NUL é uma heurística simples para arquivos binários; não é detector perfeito.
        with path.open("rb") as binary_file:
            if b"\x00" in binary_file.read(4096):
                summary.skipped += 1
                return
        with path.open("r", encoding="utf-8", errors="ignore") as text_file:
            summary.examined += 1
            for line_number, line in enumerate(text_file, start=1):
                for rule in RULES:
                    if rule.pattern.search(line):
                        summary.findings += 1
                        record = Finding(rule.rule_id, rule.category, str(path), line_number)
                        if summary.output_format == "json":
                            summary.records.append(record)
                        else:
                            # Nenhum valor ou trecho de credencial é impresso.
                            print(f"[ALERTA] {path}:{line_number} | {rule.category}")
    except PermissionError as exc:
        report_error(path, exc, summary)
    except OSError as exc:
        report_error(path, exc, summary)


def scan_directory(root: Path, summary: Summary, max_bytes: int) -> None:
    """Usa os.walk com callback de erro e sem seguir links simbólicos."""
    def on_error(exc: OSError) -> None:
        report_error(Path(exc.filename or root), exc, summary)

    for directory, folders, filenames in os.walk(
        root, topdown=True, onerror=on_error, followlinks=False
    ):
        base = Path(directory)
        folders[:] = sorted(
            name for name in folders
            if name not in IGNORED_DIRS and not (base / name).is_symlink()
        )
        for filename in sorted(filenames):
            scan_file(base / filename, summary, max_bytes)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Localiza possíveis segredos em arquivos usando apenas a biblioteca padrão."
    )
    parser.add_argument("path", type=Path, help="Arquivo ou diretório a analisar")
    parser.add_argument(
        "--max-size-kib", type=int, default=DEFAULT_MAX_SIZE_KIB,
        help="Limite por arquivo em KiB (padrão: 5120 = 5 MiB)",
    )
    parser.add_argument(
        "--fail-on-findings", action="store_true",
        help="Retorna código 1 quando há alertas (útil em automações)",
    )
    parser.add_argument(
        "--format", choices=("text", "json"), default="text",
        help="Saída humana ou JSON estruturado (padrão: text)",
    )
    args = parser.parse_args(argv)
    if args.max_size_kib <= 0:
        parser.error("--max-size-kib deve ser maior que zero")
    summary = Summary(output_format=args.format)
    try:
        if args.path.is_symlink():
            parser.error("o caminho inicial não pode ser um link simbólico")
        if args.path.is_file():
            scan_file(args.path, summary, args.max_size_kib * 1024)
        elif args.path.is_dir():
            scan_directory(args.path, summary, args.max_size_kib * 1024)
        else:
            parser.error(f"caminho inexistente ou não suportado: {args.path}")
    except PermissionError as exc:
        report_error(args.path, exc, summary)
    except OSError as exc:
        report_error(args.path, exc, summary)

    if args.format == "json":
        result = {
            "schema_version": "1.0",
            "scanner": "SecurePath CLI",
            "summary": {
                "examined": summary.examined,
                "skipped": summary.skipped,
                "io_errors": summary.errors,
                "findings": summary.findings,
            },
            "findings": [record.to_dict() for record in summary.records],
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(
            f"\nResumo: arquivos analisados={summary.examined} | "
            f"ignorados={summary.skipped} | erros de I/O={summary.errors} | "
            f"alertas={summary.findings}"
        )
    if summary.errors:
        return 2
    if summary.findings and args.fail_on_findings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
