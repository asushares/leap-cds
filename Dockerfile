
FROM node:16-alpine AS builder
LABEL maintainer="preston.lee@prestonlee.com"

ENV YARN_CACHE_FOLDER /yarn

RUN mkdir -p /app
WORKDIR /app

# COPY ["yarn.lock", "package.json", "./"]
COPY . .
RUN npm i --force -g yarn
# RUN yarn install
RUN yarn install

# RUN yarn set version 3.1.1
CMD ["yarn", "start"]
# CMD ["npm", "run", "start"]
# CMD ["node", "server.js"]

# RUN yarn
# RUN yarn run start

# RUN npm install
# COPY . .

# RUN npm run build 
# # --prod

# FROM nginx:stable-alpine

# # We need to make a few changes to the default configuration file.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# WORKDIR /usr/share/nginx/html

# # Remove any default nginx content
# RUN rm -rf *

# ## Copy build from "builder" stage, as well as runtime configuration script public folder
# COPY --from=builder /app/dist/app .
# COPY --from=builder /app/configure-from-environment.sh .

# # CMD ["./configure-from-environment.sh", "&&", "exec", "nginx", "-g", "'daemon off;'"]
# CMD /bin/sh /usr/share/nginx/html/configure-from-environment.sh && exec nginx -g 'daemon off;'
# # ENTRYPOINT ["./configure-from-environment.sh"]
# # CMD ["nginx", "-g", "daemon off;"]
