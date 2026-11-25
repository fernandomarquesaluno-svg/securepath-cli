# Mídia do vídeo do SecurePath

## Edição entregue na Tarefa 11

O filme publicado na página inicial é [securepath-semestre.mp4](securepath-semestre.mp4), com [legendas em português](securepath-semestre.vtt). Afonso narra as 11 cenas originais. Faber narra o epílogo de 66 segundos. Abaixo do filme, o público também pode escolher a apresentação HTML original.

[Fontes, créditos, roteiro e comandos de produção](../../producao/tarefa11/README.md) · [Relatório de validação](../../producao/tarefa11/VALIDACAO.md)

## Histórico das versões anteriores

O site possui um **player animado com narração pelo navegador e legendas**. Existe também um MP4 de 1 min 15 s, já gerado com narração sintética em português e legendas embutidas.

## Integrar o MP4 publicado

1. No GitHub, abra a pasta `docs/media`.
2. Escolha **Add file → Upload files** e envie o arquivo `securepath-explainer.mp4`.
3. Faça o commit. O endereço do GitHub Pages será atualizado.
4. O site verificará se o MP4 existe em `docs/media/securepath-explainer.mp4` e passará automaticamente a usar o player nativo.

O arquivo `securepath-ptbr.vtt` já acompanha o repositório para legendas selecionáveis. O MP4 também inclui legendas na imagem.

Se o MP4 não estiver hospedado, o player em HTML/JS continua funcional: animações e legendas com `speechSynthesis` do navegador.

Para executar o código real de análise, use `artefatos.py` localmente. O vídeo é educativo e usa exemplos sintéticos, nunca segredos reais.


## Narração neural revisada

Envie a faixa de áudio WAV de 62,013 s gerada em voz Afonso (pt-BR) como `securepath-narracao-natural.wav` nesta pasta. As sete cenas serão sincronizadas com a faixa. O vídeo convencional revisado, se produzido, deve ter o nome `securepath-explainer-natural.mp4`, acompanhado das legendas `securepath-natural-ptbr.vtt`. A versão original não é mais selecionada automaticamente.


A versão neural usa primeiro a mídia publicada em `securepath-narracao-natural.wav`, com a origem do áudio aprovado como alternativa. As legendas e as cenas são sincronizadas com os tempos reais da fala. A cópia local será verificada com SHA-256 antes de ser armazenada.


## Vídeo ampliado — 24/11/2026

A apresentação no site preserva a faixa aprovada de 62,013 s e adiciona 38,808 s de narração Afonso (pt-BR), com quatro cenas novas. O áudio adicional é `securepath-narracao-evolucao.wav`; a legenda unificada está em `securepath-v2-ptbr.vtt`. A duração total é aproximadamente 1:41. O player HTML usa as duas faixas gravadas e não substitui a voz por síntese do navegador. Um MP4 revisado, se publicado, deve usar o nome `securepath-explainer-v2.mp4`.
