FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json apps/web/
RUN npm install
COPY . .
RUN npm run build --workspace apps/web
EXPOSE 5173
CMD ["npm", "run", "preview", "--workspace", "apps/web"]
