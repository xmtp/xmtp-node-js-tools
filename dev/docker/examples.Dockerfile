FROM node:18

RUN corepack enable && corepack prepare yarn@3.6.3 --activate

COPY . /app/
WORKDIR /app
RUN yarn install --immutable
RUN yarn build

ARG GIT_COMMIT=unknown
LABEL git_commit=$GIT_COMMIT
ENV NODE_ENV=production

CMD ["yarn", "workspace", "@xmtp/bot-examples", "start"]