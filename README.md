# Complete a Palavra — Versão KOKORO (Voz Neural 100% no Navegador)

Jogo educativo infantil com **voz neural Kokoro rodando localmente** — sem servidor, sem chaves de API, sem custos, e **funciona offline** após o primeiro carregamento.

## Arquivos

| Arquivo | Descrição |
|---|---|
| `index.html` | Estrutura + CSP liberado para CDNs e WebAssembly |
| `styles.css` | Estilos + indicador de progresso do Kokoro |
| `script.js` | Lógica do jogo + fala híbrida (Kokoro + fallback dispositivo) |
| `kokoro-loader.js` | Integração com a biblioteca kokoro-js (ONNX via CDN) |
| `palavras.json` | Banco de palavras (42 itens) — editável |
| `manifest.json` | PWA (instalação na tela inicial) |
| `sw.js` | Service Worker — cacheia tudo, inclusive as CDNs do Kokoro |

## Como funciona

1. **Primeiro acesso**: ao clicar em "Ouvir palavra" pela primeira vez, o Kokoro baixa um modelo neural grande das CDNs (jsdelivr + HuggingFace, com CORS liberado). Recomenda-se usar Wi-Fi.
2. **Cache permanente**: o Service Worker armazena o modelo e a biblioteca. Nos próximos acessos, **não baixa de novo**.
3. **Uso offline**: depois que os arquivos e o modelo forem armazenados, o jogo pode funcionar sem internet. O navegador pode remover o cache quando houver pouco espaço.
4. **Fallback automático**: se o Kokoro falhar (navegador sem WebAssembly, pouco espaço, etc.), o jogo usa automaticamente a voz do dispositivo (`speechSynthesis`).

## Como usar

1. Hospede os 7 arquivos em **qualquer lugar** (GitHub Pages, Vercel, Netlify, hospedagem gratuita) — ou abra o `index.html` diretamente (o Service Worker e o modelo precisam de servidor HTTP, mas o jogo funciona com voz do dispositivo mesmo assim).
2. Na primeira vez que clicar em "Ouvir", aguarde o download do modelo (~220 MB). O progresso aparece na tela.
3. Pronto! Da próxima vez, funciona instantaneamente — inclusive offline.

## Modos de fala (no painel de voz)

- **🔄 Automática (recomendado)**: usa Kokoro; se falhar ou estiver carregando, usa a voz do dispositivo.
- **🧠 Apenas Kokoro**: força a voz neural local. As vozes foram treinadas principalmente para inglês; em português, a pronúncia pode variar.
- **📱 Apenas dispositivo**: usa somente `speechSynthesis` (leve, sem download).

## Vozes Kokoro disponíveis

O Kokoro-82M inclui vozes multilíngues que leem português com sotaque natural:
- **Coração (af_heart)** — suave, padrão
- **Bella (af_bella)** — feminina clara
- **Nicole (af_nicole)** — feminina
- **Adam (am_adam)** — masculino
- **Michael (am_michael)** — masculino profundo

> **Nota**: Para vozes PT-BR com sotaque perfeito, use a versão Cloudflare (Edge-TTS). O Kokoro oferece a vantagem de funcionar 100% offline.

## Compatibilidade

- Chrome/Edge 90+ (WebAssembly + Web Audio)
- Firefox 121+
- Safari 17.4+ (iOS/macOS)
- Celulares modernos (recomenda-se Wi-Fi no primeiro download)

## Comparativo: Cloudflare vs Kokoro

| | Cloudflare (Edge-TTS) | Kokoro (esta versão) |
|---|---|---|
| Servidor necessário | ✅ Worker gratuito | ❌ Nenhum |
| Download inicial | 0 MB | Grande; varia conforme os arquivos do modelo |
| Funciona offline | ❌ (sem internet = voz do dispositivo) | ✅ Total |
| Qualidade PT-BR | 🟢 Perfeita (Francisca/Antônio) | 🟡 Boa (sotaque multilíngue) |
| Limite de uso | 100 mil/dia | Ilimitado |
| Configuração | Colar endereço do Worker | Nenhuma — pronto |

Copyright © 2026 PcTech by Sinnomar Lino
