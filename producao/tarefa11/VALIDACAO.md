# Validação da Tarefa 11 · 25/11/2026

**Página de entrega:** https://fernandomarquesaluno-svg.github.io/securepath-cli/

**Filme:** https://fernandomarquesaluno-svg.github.io/securepath-cli/media/securepath-semestre.mp4

## Arquivo publicado

| Medição | Resultado |
|---|---|
| Duração do contêiner | 166,833333 s (2min46,833s) |
| Vídeo | H.264, 1920 × 1080, 30 fps, 5.005 quadros |
| Áudio | AAC estéreo, 48 kHz, 166,833 s |
| Legendas | 36 segmentos em português, faixa interna e WebVTT externo |
| Tamanho | 11.891.325 bytes |
| SHA-256 local e do download público | `68fc68cde71a43968789d0affba2736bc6441d0ad82fc0a34bc4e885d766ee21` |

## Ensaios executados

| Verificação | Evidência observada |
|---|---|
| Integridade do original | Os 6.216 caracteres do bloco visual das 11 cenas e os 888 do bloco de controles coincidem com o commit de recuperação. Os dois WAV de Afonso conservam os objetos Git originais. O botão na página abre o player anterior. |
| Reprodução integral do MP4 de distribuição | Chromium chegou a `ended=true` em velocidade 1, sem erro de mídia. Foram observados todos os 36 inícios de legenda e oito eventos de progresso entre 100 e 102 segundos, durante a mudança de capítulo. Dimensões reportadas pelo player: 1920 × 1080. |
| Ordem e sincronização | Os tempos do primeiro capítulo vêm do VTT original. Os 13 do epílogo usam o início e o fim medidos de cada tomada de voz. Os 36 segmentos são crescentes, sem sobreposição e contidos no filme. |
| Revisão visual | Inspeção de quadros distribuídos pelos capítulos e do quadro do protótipo. O texto de código que desaparecia na primeira captura foi corrigido na exportação. Comparação objetiva da cópia de distribuição com o master, SSIM 0,997261 nos 5.005 quadros. |
| Voz e mixagem | Voz nova normalizada para alvo de −17 LUFS. Música isolada medida em −31,5 LUFS e efeitos em −34,8 LUFS. Transcrição automática de controle com faster-whisper e Systran/faster-whisper-base reconheceu o sentido geral e confundiu alguns termos, entre eles K-Agent. A grafia acadêmica foi mantida nas legendas. A inteligibilidade foi verificada por meios técnicos, sem banca de ouvintes ou avaliação humana em caixas de som. |
| CLI | `python -m unittest discover -s tests`: 69 testes, todos aprovados no checkout. O resultado caracteriza a suíte funcional. |
| Navegação e scanner | Playwright em 1440 × 900 e 390 × 844. Menu desktop e móvel, leitor de arquivo, exemplo de texto, relatório sem o valor fictício, limpeza, documentação expansível e alternância de player. O exemplo detectou SEC002 e SEC004. |
| Portfólio | Carregamento das seções 6, 7 e 8, troca de aba da avaliação e mudança de modelo no comparador. Verificação em ambos os tamanhos de tela. |
| Links internos | O verificador percorreu os destinos dos elementos `a[href]` em todas as páginas HTML sob `docs/`. Conferiu existência de arquivo e âncora, inclusive os redirecionamentos. Foram 9 destinos relativos distintos na página principal, 11 no portfólio e 1 em cada redirecionador. |
| GitHub Pages | A raiz, o caminho antigo `/docs/`, o portfólio, o VTT e o MP4 responderam HTTP 200. A página pública referencia o novo arquivo. O download integral do MP4 tem o mesmo SHA-256 da cópia local. |

As dimensões móveis foram emuladas no Chromium. Não houve teste físico em telefone nem ensaio em Safari/iOS. Os testes de links abrangem os destinos internos do site. Os recursos acadêmicos hospedados por terceiros ficam fora desse total.

## Rastreabilidade

- Base e branch de recuperação: `c44104962be4073684fade14c86e16387ce9ef6a`, `recuperacao/tarefa11-c441049`.
- Fontes e produção: `ecd4c0fb936aabad599bb72bdfb26ca154952995`.
- Filme e integração: `35ec6b5b11a7832ff911129fdc4a307e05d0c65f`.
- Comparação integral do checkout de produção com os 65 objetos de arquivo desse commit: zero divergências.
- Afonso, áudio inicial: `bdee9f3803b9865c532f80d5b53372db29ae2432eefc2a420c3c083f62795b55`.
- Afonso, evolução técnica: `e7030351c51b3a5c01e99f270d8cb443873a4863ed5a2c9ce7d2cab927f7e27a`.
