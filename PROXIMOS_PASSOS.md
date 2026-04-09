# Próximos passos — depois de configurar o .env

## 1. Conferir o backend

No `.env` do **backend** você precisa de:

- `SQUARE_ACCESS_TOKEN` ✅ (você já colocou)
- `SQUARE_LOCATION_ID` — pegue no [Square Developer](https://developer.squareup.com/apps) → sua aplicação → **Locations** (copie o ID da loja, ex: `LXXX...`)
- `SQUARE_ENV=sandbox` (ou `production`)

## 2. Subir o backend

```bash
cd backend
npm install
npm run dev
```

Deve aparecer: `Servidor rodando em http://localhost:3001 (development)`.

Se der erro de variável faltando, confira o `.env` (principalmente `SQUARE_LOCATION_ID`).

## 3. Configurar o frontend

Na pasta **frontend**, crie um arquivo `.env` (pode copiar do exemplo):

```bash
cd frontend
copy .env.example .env
```

Ou crie manualmente com:

```
VITE_API_URL=http://localhost:3001
```

Assim o site consegue chamar a API (menu e pedidos).

## 4. Subir o frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse o endereço que o Vite mostrar (ex: http://localhost:5173).

## 5. Testar a API (opcional)

Com o backend rodando:

- **Health:** abra no navegador: http://localhost:3001/health (deve retornar `{"status":"ok",...}`).
- **Menu:** http://localhost:3001/api/menu (deve retornar os itens do catálogo Square, ou array vazio se o catálogo estiver vazio).

## 6. Usar menu e pedidos no site

Hoje o site usa o menu estático (`frontend/src/data/products.ts`). Para passar a usar o menu do Square:

- Chame `getMenu()` de `frontend/src/services/api` na página do Menu (por exemplo em um `useEffect`) e use o resultado no lugar dos produtos estáticos.
- No checkout, chame `createOrder(items)` com os itens do carrinho e use o `orderId` retornado (por exemplo para o Web Payments SDK do Square).

Detalhes em **frontend/SQUARE_INTEGRATION.md**.
