FROM node:18

RUN corepack enable

COPY package.json .yarnrc.yml yarn.lock /app/
WORKDIR /app
RUN yarn install --immutable
COPY . /app/
RUN yarn build

ARG GIT_COMMIT=unknown
LABEL git_commit=$GIT_COMMIT

CMD ["yarn", "workspace", "@xmtp/bot-examples", "start"]