FROM node:18

COPY . /app/
WORKDIR /app
RUN npm ci
RUN npm run build -w packages/bot-examples
CMD ["npm", "run", "start", "-w", "packages/bot-examples"]