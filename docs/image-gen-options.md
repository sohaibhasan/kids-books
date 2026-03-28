# Image Generation Options

Last updated: 2026-03-26

## Current Choice

**FLUX.1-dev via Hugging Face Inference API** — switched from FLUX.1-schnell for better quality (20-50 inference steps vs 1-4). Same HF token, same endpoint pattern.

## Comparison Table

| Provider | Model | Quality (Elo) | Cost/Image | Free Tier | Notes |
|----------|-------|---------------|------------|-----------|-------|
| HF Inference | FLUX.1-schnell | ~1,232 | ~$0.001 | ~80 imgs/month ($0.10 credit) | Fast, low quality. Previous choice. |
| **HF Inference** | **FLUX.1-dev** | **~1,245** | **~$0.001** | **~80 imgs/month ($0.10 credit)** | **Current choice. Much better quality.** |
| Together AI | FLUX.1 Schnell | ~1,232 | $0.0027 | Free signup credits | Cheapest pay-per-image |
| Together AI | FLUX.1 Dev | ~1,245 | $0.025 | Free signup credits | Good fallback provider |
| Together AI | Dreamshaper | Decent | $0.0006 | Free signup credits | Cheapest option overall |
| OpenAI | GPT Image 1 Mini | Good | $0.005 | None | Cheapest quality option |
| OpenAI | GPT Image 1.5 | ~1,264 | $0.04 | None | Top-tier quality co-leader |
| Replicate | FLUX.1 Schnell | ~1,232 | $0.003 | Limited free runs | Good model variety |
| Replicate | FLUX.1.1 Pro | ~1,265 | $0.04 | Limited free runs | Premium quality |
| BFL Direct | FLUX.2 Klein 4B | Good | $0.014 | None | New lightweight model |
| BFL Direct | FLUX.2 Pro | ~1,265 | $0.03 | None | Best FLUX quality |
| Stability AI | SD 3.5 Large | Good | ~$0.065 | 25 credits (~4-6 imgs) | Self-host option for <$1M revenue |
| Stability AI | SDXL | Decent | ~$0.02 | 25 credits (~25 imgs) | Older but cheap |
| Leonardo AI | Various | Good | Token-based | 150 tokens/day + $5 API | Generous free tier for testing |
| Google | Imagen 4 Fast | Strong | $0.02 | Web UI only (500-1K/day) | Requires GCP billing |
| fal.ai | Various | Varies | $0.03+ | Promo credits ($10-50) | Very fast inference |

## Upgrade Path

1. **Current:** FLUX.1-dev via HF (~80 free/month, ~$0.001/img after)
2. **If quality still insufficient:** Together AI + FLUX.1-dev ($0.025/img) or OpenAI GPT Image 1 Mini ($0.005/img)
3. **Premium quality:** FLUX.2 Pro ($0.03/img) or GPT Image 1.5 ($0.04/img)

## Integration Notes

- HF endpoint pattern: `https://router.huggingface.co/hf-inference/models/{model-id}`
- All HF models use the same auth: `Authorization: Bearer $HF_TOKEN`
- Together AI: `https://api.together.xyz/v1/images/generations` with `Authorization: Bearer $TOGETHER_API_KEY`
- OpenAI: `https://api.openai.com/v1/images/generations` with standard OpenAI auth
- For storybooks: always append "no text or words in the image" to prompts
- Character consistency: repeat full appearance description in every prompt
