# messenger-frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app

# копируем package-файлы и ставим зависимости
COPY messenger-frontend/package.json messenger-frontend/package-lock.json ./
RUN npm ci

# копируем весь фронтенд-код
COPY messenger-frontend/ .

EXPOSE 3000
CMD ["npm", "start"]
