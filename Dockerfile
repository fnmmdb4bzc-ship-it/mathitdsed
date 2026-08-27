FROM nginx:alpine

COPY MathIT.html /usr/share/nginx/html/index.html

EXPOSE 80
