#!/usr/bin/env python3
import argparse
from pathlib import Path
import re
import sys

PATTERNS = {
    "Chave AWS": r"AKIA[0-9A-Z]{16}",
    "Token Generico/Bearer": r"bearer\s+[a-zA-Z0-9_\-\.]{20,}",
    "Chave Privada RSA": r"-----BEGIN RSA PRIVATE KEY-----",
    "Senha em Variavel": r"(?i)(password|passwd|pwd|secret)\s*=\s*['\"].+?['\"]",
}

def scan_file(file_path: Path):
    findings = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line_num, line in enumerate(f, 1):
                for pattern_name, regex in PATTERNS.items():
                    if re.search(regex, line):
                        findings.append((line_num, pattern_name, line.strip()))
    except Exception as e:
        print(f"Erro ao ler o arquivo {file_path}: {e}", file=sys.stderr)
    return findings

def scan_directory(target_dir: Path):
    print(f"Iniciando varredura no diretório: {target_dir}")
    total_findings = 0
    for file_path in target_dir.rglob("*"):
        if file_path.is_file() and "__pycache__" not in file_path.parts:
            findings = scan_file(file_path)
            if findings:
                print(f"\n[!] Alerta em: {file_path}")
                for line_num, p_name, content in findings:
                    print(f"    Linha {line_num} | Tipo: {p_name}")
                    total_findings += 1
    print(f"\nVarredura concluída. Total de alertas encontrados: {total_findings}")

def main():
    parser = argparse.ArgumentParser(description="Scanner estático para detecção de segredos.")
    parser.add_argument("path", type=str, help="Caminho para o arquivo ou diretório a ser analisado")
    args = parser.parse_args()

    target = Path(args.path)
    if not target.exists():
        print(f"Erro: O caminho '{target}' não existe.", file=sys.stderr)
        sys.exit(1)

    if target.is_file():
        findings = scan_file(target)
        for line_num, p_name, content in findings:
            print(f"[!] {target} (Linha {line_num}) - Tipo: {p_name}")
    else:
        scan_directory(target)

if __name__ == "__main__":
    main()