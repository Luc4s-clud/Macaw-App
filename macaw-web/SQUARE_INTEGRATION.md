# Integração Square — Menu e Pedidos

Integração do menu e pedidos do Square com **boas práticas e segurança**: backend com validação, rate limit e CORS; frontend com cliente tipado, timeout e tratamento de erro.

## Visão geral

1. **Menu**: o backend busca o catálogo no Square (Catalog API); o frontend consome `GET /api/menu`.
2. **Pedidos**: o frontend envia o carrinho para `POST /api/orders`; o backend valida, sanitiza e cria o pedido no Square (Orders API). O `orderId` retornado pode ser usado no Web Payments SDK para pagamento.

**Segurança**: o Access Token do Square **nunca** vai para o frontend; apenas o backend usa credenciais.

---

## 1. Credenciais Square

1. Acesse [Square Developer Dashboard](https://developer.squareup.com/apps).
2. Crie ou abra um aplicativo.
3. **Credentials**: anote o **Access Token** (Sandbox ou Production). Use **somente no backend**.
4. **Locations**: anote o **Location ID** da loja.
5. Para pagamento no site: anote o **Application ID** (usado no frontend com Web Payments SDK).

---

## 2. Backend (`server/`)

### Estrutura

```
server/
├── config/
│   ├── env.js          # Validação de variáveis de ambiente (falha na subida)
│   └── constants.js    # Limites (itens por pedido, tamanhos, rate limit)
├── middleware/
│   ├── security.js     # Helmet + rate limit
│   ├── validate.js     # Validação de body com Zod
│   └── errorHandler.js # Erro centralizado (sem stack em produção)
├── validators/
│   └── orderSchema.js  # Schema Zod do body de POST /api/orders
├── routes/
│   ├── menu.js         # GET /api/menu
│   └── orders.js       # POST /api/orders
├── services/
│   └── squareService.js # Chamadas ao Square (sanitização, sem log de token)
├── app.js              # Criação do app Express (CORS, rotas, middlewares)
├── index.js            # Carrega env, inicia servidor
├── .env.example
└── package.json
```

### Boas práticas no backend

- **Env**: `SQUARE_ACCESS_TOKEN` e `SQUARE_LOCATION_ID` obrigatórios; servidor não sobe sem eles.
- **Validação**: body de `POST /api/orders` validado com Zod (tipos, tamanhos, limites).
- **Sanitização**: nomes, observações e quantidades limitados antes de enviar ao Square.
- **Rate limit**: 100 requisições por IP por minuto (configurável em `config/constants.js`).
- **CORS**: configurável via `CORS_ORIGIN` (múltiplas origens separadas por vírgula); em produção use a origem do seu site.
- **Helmet**: headers de segurança (CSP desabilitado para não quebrar o front; Cross-Origin-Resource-Policy configurado).
- **Erro**: handler centralizado; em produção não retorna stack trace nem mensagens internas.
- **Logs**: token e dados sensíveis nunca são logados.

### Configurar e rodar

```bash
cd server
cp .env.example .env
# Edite .env:
# SQUARE_ACCESS_TOKEN=...
# SQUARE_LOCATION_ID=...
# SQUARE_ENV=sandbox
# PORT=3001
# CORS_ORIGIN=http://localhost:5173   (ou suas origens em produção)

npm install
npm run dev
```

Servidor em `http://localhost:3001` (ou valor de `PORT`).

---

## 3. Frontend

### Estrutura

```
src/
├── config/
│   └── env.ts           # VITE_API_URL (requireApiUrl() para chamadas à API)
├── services/
│   ├── api/
│   │   ├── client.ts     # Fetch com timeout, ApiError, parsing de erro
│   │   ├── types.ts      # ApiMenuItem, CreateOrderItemInput, CreateOrderResponse
│   │   ├── menu.ts       # getMenu()
│   │   ├── orders.ts     # createOrder(items)
│   │   └── index.ts      # Reexportações
│   └── squareApi.ts      # Reexporta api/ (compatibilidade)
```

### Boas práticas no frontend

- **URL da API**: lida por `VITE_API_URL`; `requireApiUrl()` garante que está definida antes de chamar a API.
- **Cliente**: timeout (15s padrão), `Content-Type: application/json`, parsing de erro padronizado (`ApiError` com status e body).
- **Tipos**: interfaces para resposta do menu e para criação de pedido.
- **Validação**: `getMenu()` verifica que a resposta tem `items` como array.

### Configuração

No `.env` na raiz do projeto (Vite):

```env
VITE_API_URL=http://localhost:3001
```

### Uso

```ts
import { getMenu, createOrder, ApiError } from '@/services/api';

// Menu
const items = await getMenu();

// Pedido (ex.: no checkout)
const payload = cartItems.map((i) => ({
  productId: i.product.id,
  name: i.product.name,
  price: i.product.price,
  quantity: i.quantity,
  observation: i.observation ?? undefined,
}));
const { orderId } = await createOrder(payload);
// use orderId com Web Payments SDK
```

Tratamento de erro:

```ts
try {
  const items = await getMenu();
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.status, err.message, err.body);
  }
}
```

---

## 4. Pagamento (opcional)

1. Inclua o [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview) na página de checkout.
2. Use **Application ID** e **Location ID** no frontend (nunca o Access Token).
3. Crie o pedido no backend (`createOrder`) e receba o `orderId`.
4. Use o SDK para criar o pagamento associado a esse `orderId` ([Pay for Orders](https://developer.squareup.com/docs/orders-api/pay-for-orders)).

---

## Resumo

| Camada   | Responsabilidade |
|----------|-------------------|
| Backend  | Validar env, rate limit, CORS, Helmet, validar/sanitizar body, chamar Square, nunca expor token. |
| Frontend | Chamar apenas a própria API (VITE_API_URL), timeout, tipos, tratamento de erro com `ApiError`. |

Depois de configurar `.env` no backend e `VITE_API_URL` no frontend, use `getMenu()` e `createOrder()` para importar o menu do Square e fazer o pedido no seu sistema de forma segura.
