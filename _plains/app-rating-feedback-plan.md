# App Rating & Feedback Plan

## Objetivo

Coletar avaliações na loja (Google Play) e feedback qualitativo dos usuários de forma natural, sem parecer intrusivo.

---

## Recomendação técnica: `expo-store-review`

A Expo já tem o pacote oficial `expo-store-review` que chama a API nativa de avaliação do Google Play (`ReviewManager`) e da App Store (`SKStoreReviewController`).

```bash
npx expo install expo-store-review
```

A vantagem é que abre o dialog de avaliação **dentro do app** (sem redirecionar para a loja) — é a experiência recomendada pelo Google e Apple. O sistema operacional controla quantas vezes o dialog aparece para não incomodar.

```ts
import * as StoreReview from "expo-store-review";

const requestReview = async () => {
  if (await StoreReview.hasAction()) {
    await StoreReview.requestReview();
  }
};
```

---

## Quando pedir a avaliação (timing é tudo)

Pedir cedo demais = usuário não tem opinião formada → avaliação vazia ou negativa.

### Gatilhos recomendados (em ordem de qualidade do sinal)

| Gatilho                                                       | Sinal                | Momento                          |
| ------------------------------------------------------------- | -------------------- | -------------------------------- |
| Usuário completa **N treinos** (ex: 5)                        | Alta intenção de uso | Após tela de conclusão de treino |
| Usuário usa o app por **X dias corridos** (ex: 7)             | Retenção             | Na abertura do app               |
| Usuário cria **primeira rotina**                              | Investimento no app  | Logo após salvar                 |
| Usuário usa **mais de uma semana** E completou **3+ treinos** | Combinação sólida    | Tela principal, momento de idle  |

### Gatilho sugerido para o gym-log

> **Após o 5º treino concluído**, no momento da tela de pós-treino (`PostFinishQuickActionsSheet`), antes de fechar — é o pico de satisfação do usuário.

---

## Regras para não ser chato

- **Uma vez por versão** — nunca repetir na mesma versão do app.
- **Nunca em momento de frustração** — erro, loading, ou logo após uma ação falhar.
- **Nunca forçar** — o dialog nativo já garante isso, mas não adicionar lógica de "por favor avalie" com modal próprio.
- **Salvar em AsyncStorage** que o pedido já foi feito + versão do app em que foi pedido.

---

## Fluxo de implementação

```
1. Instalar expo-store-review
2. Criar hook useRatingPrompt:
   - Lê contagem de treinos concluídos (já existe no DB)
   - Lê flag "já pediu avaliação nessa versão" do AsyncStorage
   - Expõe: shouldPrompt (boolean) + markAsPrompted()
3. Chamar requestReview() no PostFinishQuickActionsSheet
   quando shouldPrompt === true, depois de 1s de delay
   (deixar o usuário ver a tela de conclusão antes)
4. Chamar markAsPrompted() após disparar
```

---

## Feedback qualitativo (além da nota da loja)

A nota da loja não diz **o que melhorar**. Para isso:

### Opção A — Link para formulário externo

Botão discreto em Settings → "Dar feedback" → abre Google Forms ou Typeform com 2-3 perguntas abertas.

- Prós: zero infraestrutura, fácil de mudar as perguntas
- Contras: taxa de resposta baixa (sai do app)

### Opção B — Interceptar avaliações baixas antes da loja

Antes de chamar `StoreReview`, mostrar uma pergunta simples:

> "Você está gostando do Gym Log?"  
> [Sim ✓] [Não, tenho um problema]

- Se **Sim** → chama `requestReview()` → vai para a loja
- Se **Não** → abre email/formulário interno → não vai para a loja

Essa técnica é chamada de **rating gate** e é muito usada. Não viola as políticas da Play Store (que proíbe pedir só avaliações positivas) desde que o formulário interno seja genuíno.

### Opção recomendada para agora

**Opção A** primeiro (link em Settings, zero código). Quando tiver usuários suficientes, implementa a **Opção B** com o rating gate.

---

## Checklist de implementação

- [ ] Instalar `expo-store-review`
- [ ] Criar hook `useRatingPrompt` com lógica de contagem + versão
- [ ] Integrar no `PostFinishQuickActionsSheet` após 5 treinos
- [ ] Adicionar botão "Dar feedback" em Settings → link externo (Typeform/Google Forms)
- [ ] (Futuro) Rating gate antes do `requestReview()`
