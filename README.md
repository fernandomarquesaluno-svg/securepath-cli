# SecurePath CLI: Scanner Estático de Segredos Expostos

Ferramenta de linha de comando (CLI) desenvolvida em Python para análise estática de código-fonte e detecção de credenciais expostas.

## 1. Descrição do Problema e Motivação
O vazamento acidental de chaves de API, tokens e senhas em repositórios de código é uma das falhas de segurança mais comuns. Este projeto visa automatizar a identificação precoce dessas vulnerabilidades antes da publicação.

## 2. Objetivo do Artefato
Fornecer um script leve que varra arquivos e diretórios em busca de padrões Regex correspondentes a credenciais sensíveis.

## 3. Principais Funcionalidades
* Varredura recursiva de diretórios e arquivos individuais.
* Detecção de Chaves AWS, Tokens Bearer, Chaves RSA e Senhas em variáveis.
* Implementado apenas com bibliotecas nativas do Python.

## 4. Requisitos
* Python 3.8 ou superior.

## 5. Como Executar
```bash
python artefatos.py teste.txt