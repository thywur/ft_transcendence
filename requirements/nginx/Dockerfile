FROM nginx:alpine

RUN apk update
RUN apk upgrade
RUN apk add openssl

EXPOSE 443
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt -subj "/C=FR/L=LYON/O=42/CN=peas.42.fr"

COPY ./www /var/www/html

COPY conf/default /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /var/www/html && \
    chmod -R 755 /var/www/html


