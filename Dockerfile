FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    TZ=America/Sao_Paulo

# A aplicação não tem dependências de produção (só usa módulos nativos do Node),
# então não precisa de npm install aqui. O package.json vai junto por causa do "type": "module".
COPY package.json ./
COPY src ./src
COPY public ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
