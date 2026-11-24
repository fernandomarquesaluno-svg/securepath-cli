"""Bateria adicional: 50 casos para validar configuração de regras personalizadas."""

import json
from pathlib import Path
import tempfile
import unittest

from artefatos import load_rules_file, main


INVALID_CONFIGS = [
    ("raiz_lista", []),
    ("campo_rules_ausente", {}),
    ("rules_nulo", {"rules": None}),
    ("rules_texto", {"rules": "ORG001"}),
    ("rules_objeto", {"rules": {}}),
    ("mais_de_cem_regras", {"rules": [{"id": f"ORG{i:03d}", "category": "x", "pattern": "x"} for i in range(101)]}),
    ("regra_primitiva", {"rules": ["ORG001"]}),
    ("id_numero", {"rules": [{"id": 123, "category": "x", "pattern": "x"}]}),
    ("id_ausente", {"rules": [{"category": "x", "pattern": "x"}]}),
    ("id_minusculo", {"rules": [{"id": "org001", "category": "x", "pattern": "x"}]}),
    ("id_curto", {"rules": [{"id": "AB", "category": "x", "pattern": "x"}]}),
    ("id_comeca_numero", {"rules": [{"id": "1AB", "category": "x", "pattern": "x"}]}),
    ("id_duplicado", {"rules": [{"id": "ORG001", "category": "x", "pattern": "x"}, {"id": "ORG001", "category": "y", "pattern": "y"}]}),
    ("id_reservado", {"rules": [{"id": "SEC001", "category": "x", "pattern": "x"}]}),
    ("categoria_numero", {"rules": [{"id": "ORG001", "category": 7, "pattern": "x"}]}),
    ("categoria_vazia", {"rules": [{"id": "ORG001", "category": "", "pattern": "x"}]}),
    ("categoria_espacos", {"rules": [{"id": "ORG001", "category": "   ", "pattern": "x"}]}),
    ("categoria_longa", {"rules": [{"id": "ORG001", "category": "x" * 81, "pattern": "x"}]}),
    ("pattern_numero", {"rules": [{"id": "ORG001", "category": "x", "pattern": 4}]}),
    ("pattern_vazio", {"rules": [{"id": "ORG001", "category": "x", "pattern": ""}]}),
    ("pattern_longo", {"rules": [{"id": "ORG001", "category": "x", "pattern": "x" * 513}]}),
    ("regex_invalida", {"rules": [{"id": "ORG001", "category": "x", "pattern": "["}]}),
    ("flags_texto", {"rules": [{"id": "ORG001", "category": "x", "pattern": "x", "flags": "IGNORECASE"}]}),
    ("flag_nao_suportada", {"rules": [{"id": "ORG001", "category": "x", "pattern": "x", "flags": ["MULTILINE"]}]}),
    ("flags_numero", {"rules": [{"id": "ORG001", "category": "x", "pattern": "x", "flags": 1}]}),
]


def make_valid_case(index):
    rule_id = "ORG" + f"{index:03d}"
    token = f"tag{index:02d}"
    ignore_case = index % 2 == 0
    pattern_token = token.upper() if ignore_case else token
    source_token = token.lower() if ignore_case else token
    category = "C" * (1 + ((index - 1) % 80))
    rule = {
        "id": rule_id,
        "category": category,
        "pattern": r"\b" + pattern_token + r"\b",
        "flags": ["IGNORECASE"] if ignore_case else [],
    }
    return rule_id, source_token, {"rules": [rule]}


class AdditionalRuleConfigTests(unittest.TestCase):
    pass

def _add_invalid_method(name, config):
    def test(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "rules.json"
            path.write_text(json.dumps(config), encoding="utf-8")
            with self.assertRaises(ValueError, msg=name):
                load_rules_file(path)
    test.__name__ = "test_invalid_" + name
    setattr(AdditionalRuleConfigTests, test.__name__, test)


def _add_valid_method(index):
    rule_id, token, config = make_valid_case(index)
    def test(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rules_path = root / "rules.json"
            target_path = root / "sample.txt"
            rules_path.write_text(json.dumps(config), encoding="utf-8")
            target_path.write_text(token + "\n", encoding="utf-8")
            rules = load_rules_file(rules_path)
            self.assertEqual(rules[-1].rule_id, rule_id)
            self.assertTrue(rules[-1].pattern.search(token))
    test.__name__ = f"test_valid_rule_{index:02d}_loads_and_matches"
    setattr(AdditionalRuleConfigTests, test.__name__, test)


for _name, _config in INVALID_CONFIGS:
    _add_invalid_method(_name, _config)

for _index in range(1, 26):
    _add_valid_method(_index)


if __name__ == "__main__":
    unittest.main()
