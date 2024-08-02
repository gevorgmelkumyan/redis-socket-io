FROM node:21

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

FROM debian:12-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends supervisor vim && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* && \
    mkdir -p /var/log/supervisor

COPY ./config/server.conf /etc/supervisor/conf.d/server.conf
COPY ./config/supervisord.conf /etc/supervisor/supervisord.conf

CMD ["/usr/bin/supervisord"]
