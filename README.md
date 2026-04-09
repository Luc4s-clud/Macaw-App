# Macaw Açaíteria

Projeto separado em **backend** e **frontend**.

## Estrutura

```
macaw/
├── backend/     # API Node/Express (Square: menu e pedidos)
├── frontend/    # Site React/Vite (Macaw Açaíteria)
└── README.md
```

## Backend

- **Tecnologia:** Node.js, Express.
- **Função:** Integração com Square (Catalog API e Orders API); validação, rate limit, CORS.
- **Como rodar:**
  ```bash
  cd backend
  cp .env.example .env
  # Edite .env com SQUARE_ACCESS_TOKEN e SQUARE_LOCATION_ID
  npm install
  npm run dev
  ```
- Servidor em `http://localhost:3001` (ou valor de `PORT` no `.env`).

## Frontend

- **Tecnologia:** React, Vite, TypeScript, Tailwind.
- **Como rodar:**
  ```bash
  cd frontend
  npm install
  # Crie .env com VITE_API_URL=http://localhost:3001 (se for usar a API)
  npm run dev
  ```
- Site em `http://localhost:5173` (ou outra porta do Vite).

## Integração Square

Veja **frontend/SQUARE_INTEGRATION.md** para credenciais, endpoints e uso de `getMenu()` e `createOrder()`.
