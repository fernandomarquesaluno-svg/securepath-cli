# Mídia do vídeo do SecurePath

O site possui um **player animado com narração pelo navegador e legendas**. Existe também um MP4 de 1 min 15 s, já gerado com narração sintética em português e legendas embutidas.

## Integrar o MP4 publicado

1. No GitHub, abra a pasta `docs/media`.
2. Escolha **Add file → Upload files** e envie o arquivo `securepath-explainer.mp4`.
3. Faça o commit. O endereço do GitHub Pages será atualizado.
4. O site verificará se o MP4 existe em `docs/media/securepath-explainer.mp4` e passará automaticamente a usar o player nativo.

O arquivo `securepath-ptbr.vtt` já acompanha o repositório para legendas selecionáveis. O MP4 também inclui legendas na imagem.

Se o MP4 não estiver hospedado, o player em HTML/JS continua funcional: animações e legendas com `speechSynthesis` do navegador.

Para executar o código real de análise, use `artefatos.py` localmente. O vídeo é educativo e usa exemplos sintéticos, nunca segredos reais.
