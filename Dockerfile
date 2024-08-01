FROM node:21

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN apt-get update && \
    apt-get install -y supervisor vim && \
    mkdir -p /var/log/supervisor

COPY ./config/server.conf /etc/supervisor/conf.d/server.conf
COPY ./config/supervisord.conf /etc/supervisor/supervisord.conf

CMD ["/usr/bin/supervisord"]
