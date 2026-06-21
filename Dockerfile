FROM node:22-alpine

WORKDIR /app

# copy package files first — layer caching optimization
COPY package*.json ./
RUN npm install

#copy prisma schema before generating the client
COPY prisma ./prisma
RUN npx prisma generate

# copy the rest of the application code
COPY . .

# start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/index.ts"]