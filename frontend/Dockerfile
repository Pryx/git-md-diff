FROM nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY ./build/ /usr/share/nginx/html/app/
COPY ./nginx/ /etc/nginx/conf.d/
