# LLM Configuratie — MC Toetsvalidatie Platform

**Laatst bijgewerkt:** Februari 2026

---

## Gekozen Modellenmix

| Taak | Model | Model ID | Prijs (per 1M tokens) |
|------|-------|----------|----------------------|
| **Validatie** | Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | $1 / $5 |
| **Generatie** | Claude Sonnet 4.5 | `claude-sonnet-4-5-20250929` | $3 / $15 |
| **Generatie (complex)** | Claude Opus 4.6 | `claude-opus-4-6` | $5 / $25 |

---

## Rationale

### Validatie → Haiku 4.5

De validatietaak is primair een **classificatietaak**:
- Scores toekennen (1-5) op drie dimensies
- Bloom-niveau classificeren (4 categorieën)
- Discriminatieniveau bepalen (4 categorieën)
- Toelichtingen genereren op basis van vaste criteria

Dit vereist geen deep reasoning of creativiteit. Haiku 4.5 presteert uitstekend op gestructureerde output taken en is:
- **3x goedkoper** dan Sonnet
- **4x sneller** (~7s vs ~28s per vraag)
- Voldoende kwaliteit voor classificatie + toelichting

### Generatie → Sonnet 4.5

De generatietaak vereist:
- **Creativiteit** — plausibele afleiders verzinnen
- **Grounding** — vragen baseren op bronmateriaal
- **Bloom-niveau** — vragen op het juiste cognitieve niveau formuleren

Sonnet biedt de optimale balans tussen kwaliteit en kosten voor creatieve taken.

### Opus 4.6 (optioneel)

Beschikbaar voor:
- Bloom-niveau "analyseren" (hoogste complexiteit)
- Edge cases waar Sonnet onvoldoende kwaliteit levert
- Niet standaard ingeschakeld vanwege hogere kosten

---

## Configuratie in Code

**Bestand:** `sidecar/llm/client.py`

```python
class LLMClient:
    MODEL_HAIKU = "claude-haiku-4-5-20251001"
    MODEL_SONNET = "claude-sonnet-4-5-20250929"
    MODEL_OPUS = "claude-opus-4-6"

    def validate_question(..., model: str | None = None):
        # Default: Haiku voor kostenefficiëntie
        model=model or self.MODEL_HAIKU

    def generate_questions(..., model: str | None = None):
        # Default: Sonnet voor kwaliteit
        model=model or self.MODEL_SONNET
```

---

## Kostenprojectie

### Per 1000 vragen/maand

| Component | Model | Input | Output | Totaal |
|-----------|-------|-------|--------|--------|
| Validatie (1000×) | Haiku | $1.50 | $4.00 | **$5.50** |
| Generatie (200×) | Sonnet | $0.36 | $0.90 | **$1.26** |
| **Totaal** | | | | **~$7/maand** |

### Vergelijking met alternatieven

| Configuratie | Maandkosten | Besparing |
|--------------|-------------|-----------|
| Haiku + Sonnet (huidig) | $7 | — |
| Sonnet only | $18 | -61% |
| Gemini Flash-Lite + Flash | $1 | +86% |

---

## API Instellingen

### Validatie

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| `temperature` | 0.0 | Consistente, reproduceerbare scores |
| `max_tokens` | 2048 | Voldoende voor structured output |
| `tool_choice` | `{"type": "tool", "name": "validation_result"}` | Gegarandeerd structured output |

### Generatie

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| `temperature` | 0.5 | Variatie in gegenereerde vragen |
| `max_tokens` | 4096 | Ruimte voor meerdere vragen |
| `tool_choice` | `{"type": "tool", "name": "generation_result"}` | Gegarandeerd structured output |

---

## Toekomstige Optimalisaties

### Prompt Caching

De criteria-bestanden (~3000 tokens) worden bij elke call meegezonden. Met Anthropic's prompt caching:
- **Write:** 1.25x input prijs (eenmalig per 5 min)
- **Read:** 0.1x input prijs (alle volgende calls)

**Geschatte extra besparing:** 30-40% op input tokens bij batch processing.

### Batch API

Voor bulk validatie (>100 vragen):
- 50% korting op alle tokens
- Asynchrone verwerking (uren)
- Geschikt voor nachtelijke batch-runs

---

## Alternatieven Overwogen

### Google Gemini

| Aspect | Gemini | Claude |
|--------|--------|--------|
| Kosten | 5-10x goedkoper | Hoger |
| NL taalondersteuning | Goed | Uitstekend |
| Structured output | Ondersteund | Native, beproefd |
| Migratie-inspanning | ~4 uur | Geen |

**Conclusie:** Bij huidige volumes (<5000 vragen/maand) weegt de besparing niet op tegen de migratie-inspanning en het risico op lagere NL-kwaliteit.

---

## Monitoring & Evaluatie

### Metrics om te tracken

1. **Kosten per vraag** — validatie en generatie apart
2. **Response tijd** — p50, p95, p99
3. **Foutpercentage** — `max_tokens`, parsing errors
4. **Kwaliteitsscore** — steekproef van Haiku vs Sonnet toelichtingen

### Evaluatiemoment

Na 1 maand productie:
- Vergelijk Haiku-toelichtingen met Sonnet (steekproef 50 vragen)
- Als kwaliteit onvoldoende: switch validatie terug naar Sonnet
- Als kwaliteit goed: overweeg ook generatie naar Haiku voor lagere Bloom-niveaus
