"""Benchmark sintético reproduzível. Execute: python benchmark_securepath.py"""
import argparse
import json
import platform
from pathlib import Path
from statistics import median
import tempfile
from time import perf_counter

from artefatos import Summary, scan_directory, DEFAULT_MAX_SIZE_KIB

def corpus(root, copies):
    positive = [
        "AKIA" + "0" * 16,
        "Bearer " + "x" * 20,
        "-----BEGIN " + "RSA PRIVATE KEY-----",
        'password' + ' = "ficticio"',
        "ASIA" + "0" * 16,
        "ghp_" + "x" * 36,
        "-----BEGIN " + "OPENSSH PRIVATE KEY-----",
    ]
    negative = ["password = process.env.PASSWORD", "Bearer short",
                "AKIA123", "print('hello')", "secret = None", "ghp_short",
                "-----BEGIN PUBLIC KEY-----"]
    expected = set()
    all_lines = set()
    for i in range(copies):
        path = root / f"sample_{i:05d}.txt"
        lines = positive + negative
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        expected.update((path.name, j) for j in range(1, len(positive)+1))
        all_lines.update((path.name, j) for j in range(1, len(lines)+1))
    return expected, all_lines

def ratio(a, b):
    return a / b if b else None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--files", type=int, default=200, choices=range(1, 10001), metavar="1..10000")
    parser.add_argument("--rounds", type=int, default=5, choices=range(1, 21), metavar="1..20")
    args = parser.parse_args()
    reports = []
    with tempfile.TemporaryDirectory(prefix="securepath-bench-") as tmp:
        root = Path(tmp)
        expected, universe = corpus(root, args.files)
        size = sum(p.stat().st_size for p in root.iterdir())
        for workers in (1, 4, 8):
            elapsed = []
            for _ in range(args.rounds):
                summary = Summary()
                start = perf_counter()
                scan_directory(root, summary, DEFAULT_MAX_SIZE_KIB * 1024, workers=workers)
                elapsed.append(perf_counter()-start)
                if summary.errors or summary.skipped or summary.examined != args.files:
                    raise RuntimeError("Corpus não analisado integralmente")
                found = {(Path(r.path).name, r.line) for r in summary.records}
                if not found <= universe:
                    raise RuntimeError("Resultado fora do corpus rotulado")
                tp, fp, fn = len(found & expected), len(found - expected), len(expected - found)
                tn = len(universe - (found | expected))
            med = median(elapsed)
            reports.append({"workers": workers, "seconds_each": elapsed,
                "median_seconds": med, "MiB_per_second": ratio(size / 1048576, med),
                "tp": tp, "fp": fp, "fn": fn, "tn": tn,
                "precision": ratio(tp, tp+fp), "recall": ratio(tp, tp+fn),
                "f1": ratio(2*tp, 2*tp+fp+fn)})
    print(json.dumps({"scope": "synthetic repeated patterns; not real-world accuracy",
        "python": platform.python_version(), "platform": platform.platform(),
        "files": args.files, "bytes": size, "rounds": args.rounds,
        "results": reports}, indent=2))

if __name__ == "__main__":
    main()
