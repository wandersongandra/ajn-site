# Acervo fotográfico AJN — substituição das imagens genéricas

**Revisão:** 9 de outubro de 2026

## Origem e tratamento

Arquivos disponibilizados pela AJN em três arquivos compactados do OneDrive e fotografias enviadas anteriormente nesta conversa. As fotos selecionadas passaram por ajustes discretos de luz, contraste, enquadramento e conversão WebP. Não foram geradas pessoas, equipamentos ou operações artificiais para representar serviços executados.

O site usa arquivos locais em `public/images/acervo-ajn/` e `public/images/social/`. As capas do blog e da seção de serviços da Home ficam em `src/assets/blog/ajn/` e `src/assets/home-services/ajn/` para que o Astro processe dimensões responsivas.

## Publicações do Instagram

A seção editorial da Home mantém os links originais do perfil AJN, mas **as imagens locais são fotografias de contexto do acervo, não necessariamente capturas dos seis posts**. O texto no rodapé explicita essa distinção. Nenhum Instagram embed, script ou cookie de terceiro carrega automaticamente.

Fotografias da equipe e de clientes devem ter autorização de uso comercial; a inclusão no acervo não substitui a conferência de consentimentos. Se uma foto não tiver autorização, substitua-a por outra que corresponda ao tema antes da publicação.

## Substituições no blog

- `gestao-de-terceiros-em-sst`: profissionais com EPIs em área operacional
- `eventos-esocial-sst`: análise de documentação
- `apr-e-permissao-de-trabalho`: conversa preventiva em campo
- `nr-10-documentacao-capacitacao-e-transicao`: infraestrutura de rede elétrica
- `nr-12-analise-de-riscos-de-maquinas`: máquina em canteiro de obras
- `investigacao-de-acidentes-e-aprendizado-preventivo`: equipe e condições de trabalho em campo (não é fotografia de acidente)
- `gestao-de-residuos-na-operacao`: pontos de coleta de resíduos
- `controle-de-qualidade-em-obras-e-servicos`: fundação e formas em obra
- `ppcip-avcb-clcb-como-organizar-regularizacao`: instalações físicas de hidrante (não indica AVCB emitido)
- `nr-35-trabalho-em-altura-e-seguranca`: trabalhador em plataforma elevatória
- `um-pouco-sobre-nos`: equipe técnica em campo

Não usamos fotos aleatórias de escavação em artigos sobre PCMSO, ergonomia e avaliações quantitativas do LTCAT sem evidência documental específica.

## Serviços

Os cartões da Home com fotografias novas são assessoria, eSocial, perícias, prevenção contra incêndio e treinamentos. A imagem de PCMSO foi mantida. Os cartões no índice de serviços passaram a usar imagens reais contextualizadas; imagens de hidrantes ou rede elétrica não comprovam projeto aprovado, responsabilidade técnica ou licença de qualquer entidade.

## Qualidade e implantação

- Verificar `npm run check`, `npm run build`, `npm run audit:social`, `npm run validate` e testes de navegador em 320, 390, 768 e 1440 pixels.
- Confirmar cortes em `object-fit: cover` e `srcset` gerado pelo Astro nos cards.
- Conferir `alt` editorial e acessibilidade de links.
- Checar autorização de trabalhadores, clientes, uniforme e local antes de usar as imagens, sobretudo as da Hemarcon.
- Publicar somente após testes e conferência editorial; `main` aciona deploy automático Hostinger.
