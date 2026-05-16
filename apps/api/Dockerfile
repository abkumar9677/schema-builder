FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY prisma prisma
RUN npm install
COPY . .
RUN npm run prisma:generate && npm run build --workspace apps/api
EXPOSE 8080
CMD ["npm", "run", "start", "--workspace", "apps/api"]
