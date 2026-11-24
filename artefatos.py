#!/usr/bin/env python3
"""SecurePath CLI: varredura local e heurística de possíveis segredos.

Somente biblioteca padrão. Nenhum conteúdo de segredo é exibido.
"""

import argparse
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
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
    error_messages: list[str] = field(default_factory=list)


def report_error(path: Path, exc: OSError, summary: Summary, emit: bool = True) -> None:
    summary.errors += 1
    message = f"[ERRO] Não foi possível acessar {path}: {exc.strerror or exc}"
    if emit:
        print(message, file=sys.stderr)
    else:
        summary.error_messages.append(message)


def scan_file(
    path: Path,
    summary: Summary,
    max_bytes: int,
    rules=RULES,
    emit: bool = True,
) -> None:
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
                for rule in rules:
                    if rule.pattern.search(line):
                        summary.findings += 1
                        record = Finding(rule.rule_id, rule.category, str(path), line_number)
                        if emit:
                            # Nenhum valor ou trecho de credencial é impresso.
                            print(f"[ALERTA] {path}:{line_number} | {rule.category}")
                        else:
                            summary.records.append(record)
    except PermissionError as exc:
        report_error(path, exc, summary, emit=emit)
    except OSError as exc:
        report_error(path, exc, summary, emit=emit)


def scan_directory(
    root: Path,
    summary: Summary,
    max_bytes: int,
    rules=RULES,
    workers: int = 1,
    extra_ignored_dirs=(),
) -> None:
    """Percorre a árvore sem seguir links e limita a fila de trabalho paralela."""
    ignored_dirs = IGNORED_DIRS.union(extra_ignored_dirs)

    def on_error(exc: OSError) -> None:
        report_error(Path(exc.filename or root), exc, summary, emit=False)

    def file_paths():
        for directory, folders, filenames in os.walk(
            root, topdown=True, onerror=on_error, followlinks=False
        ):
            base = Path(directory)
            folders[:] = sorted(
                name for name in folders
                if name not in ignored_dirs and not (base / name).is_symlink()
            )
            for filename in sorted(filenames):
                yield base / filename

    def scan_one(path: Path) -> Summary:
        # Cada tarefa possui contadores próprios; os resultados são agregados
        # pela thread principal, sem condições de corrida nos totais.
        local = Summary(output_format=summary.output_format)
        scan_file(path, local, max_bytes, rules=rules, emit=False)
        return local

    def merge(local: Summary) -> None:
        summary.examined += local.examined
        summary.skipped += local.skipped
        summary.errors += local.errors
        summary.findings += local.findings
        summary.records.extend(local.records)
        summary.error_messages.extend(local.error_messages)

    if workers == 1:
        for path in file_paths():
            merge(scan_one(path))
        return

    # Mantém no máximo 2 tarefas pendentes por worker, evitando carregar uma
    # lista completa de caminhos de projetos grandes na memória.
    with ThreadPoolExecutor(max_workers=workers) as executor:
        pending = set()
        for path in file_paths():
            pending.add(executor.submit(scan_one, path))
            if len(pending) >= workers * 2:
                done, pending = wait(pending, return_when=FIRST_COMPLETED)
                for future in done:
                    merge(future.result())
        for future in pending:
            merge(future.result())


def load_rules_file(path: Path):
    """Carrega regras adicionais de um JSON criado pelo usuário."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"não foi possível ler o arquivo de regras: {exc}") from exc
    entries = data.get("rules") if isinstance(data, dict) else None
    if not isinstance(entries, list):
        raise ValueError("o JSON deve conter uma lista no campo 'rules'")
    if len(entries) > 100:
        raise ValueError("o arquivo pode definir no máximo 100 regras adicionais")

    custom_rules = []
    used_ids = {rule.rule_id for rule in RULES}
    for index, entry in enumerate(entries, start=1):
        if not isinstance(entry, dict):
            raise ValueError(f"a regra {index} deve ser um objeto JSON")
        rule_id = entry.get("id")
        category = entry.get("category")
        expression = entry.get("pattern")
        flags = entry.get("flags", [])
        if not isinstance(rule_id, str) or not re.fullmatch(r"[A-Z][A-Z0-9_-]{2,31}", rule_id):
            raise ValueError(f"ID inválido na regra {index}")
        if rule_id in used_ids:
            raise ValueError(f"ID de regra duplicado: {rule_id}")
        if not isinstance(category, str) or not category.strip() or len(category) > 80:
            raise ValueError(f"categoria inválida na regra {index}")
        if not isinstance(expression, str) or not expression or len(expression) > 512:
            raise ValueError(f"padrão inválido na regra {index} (limite: 512 caracteres)")
        if not isinstance(flags, list) or any(flag != "IGNORECASE" for flag in flags):
            raise ValueError(f"flags inválidas na regra {index}; use apenas IGNORECASE")
        try:
            pattern = re.compile(expression, re.IGNORECASE if "IGNORECASE" in flags else 0)
        except re.error as exc:
            raise ValueError(f"regex inválida na regra {index}: {exc}") from exc
        custom_rules.append(Rule(rule_id, category.strip(), pattern))
        used_ids.add(rule_id)
    return (*RULES, *custom_rules)


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
    parser.add_argument(
        "--workers", type=int, default=1,
        help="Arquivos analisados em paralelo (padrão: 1; recomendado para árvores grandes)",
    )
    parser.add_argument(
        "--rules-file", type=Path,
        help="JSON com regras regex adicionais específicas do projeto",
    )
    parser.add_argument(
        "--exclude-dir", action="append", default=[], metavar="NOME",
        help="Diretório adicional a ignorar; pode ser repetido",
    )
    args = parser.parse_args(argv)
    if args.max_size_kib <= 0:
        parser.error("--max-size-kib deve ser maior que zero")
    if args.workers <= 0 or args.workers > 64:
        parser.error("--workers deve estar entre 1 e 64")
    try:
        rules = load_rules_file(args.rules_file) if args.rules_file else RULES
    except ValueError as exc:
        parser.error(str(exc))
    summary = Summary(output_format=args.format)
    try:
        if args.path.is_symlink():
            parser.error("o caminho inicial não pode ser um link simbólico")
        if args.path.is_file():
            scan_file(args.path, summary, args.max_size_kib * 1024, rules=rules, emit=False)
        elif args.path.is_dir():
            scan_directory(
                args.path, summary, args.max_size_kib * 1024,
                rules=rules, workers=args.workers,
                extra_ignored_dirs=args.exclude_dir,
            )
        else:
            parser.error(f"caminho inexistente ou não suportado: {args.path}")
    except PermissionError as exc:
        report_error(args.path, exc, summary)
    except OSError as exc:
        report_error(args.path, exc, summary, emit=False)

    for message in sorted(summary.error_messages):
        print(message, file=sys.stderr)

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
            "findings": [
                record.to_dict()
                for record in sorted(summary.records, key=lambda item: (item.path, item.line, item.rule_id))
            ],
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for record in sorted(summary.records, key=lambda item: (item.path, item.line, item.rule_id)):
            print(f"[ALERTA] {record.path}:{record.line} | {record.category}")
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

