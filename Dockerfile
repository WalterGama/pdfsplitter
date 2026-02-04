# Estágio 1: Build da aplicação React/Vite
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências (incluindo devDependencies para o build)
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Executa o build de produção (gera a pasta /dist)
RUN npm run build

# Estágio 2: Servidor de Produção (Nginx)
FROM nginx:stable-alpine

# Remove a configuração padrão do Nginx e adiciona a nossa otimizada
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 para tráfego web
EXPOSE 80

# Inicia o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
