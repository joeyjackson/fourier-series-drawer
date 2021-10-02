FROM node:12-alpine as build
RUN npm install -g typescript
WORKDIR /build
COPY react-app/package*.json /build/react-app/
RUN cd /build/react-app/ && npm install
COPY package*.json /build/
RUN npm install
COPY . .
RUN yarn build

FROM node:12-alpine
WORKDIR /app
COPY package*.json /app/
RUN npm install --only=prod
COPY --from=build /build/backend/dist/ /app/backend/dist/
COPY --from=build /build/react-app/build/ /app/react-app/build/
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "backend/dist/app.js"]