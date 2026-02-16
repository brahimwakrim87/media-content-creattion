FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    acl bash git icu-dev libpq-dev libsodium-dev libzip-dev \
    linux-headers postgresql-dev zip unzip fcgi

RUN docker-php-ext-install \
    intl opcache pdo_pgsql sodium zip bcmath sysvsem

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini
COPY docker/php/php-fpm.conf /usr/local/etc/php-fpm.d/zz-app.conf

WORKDIR /var/www/backend

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD SCRIPT_NAME=/fpm-status SCRIPT_FILENAME=/fpm-status REQUEST_METHOD=GET \
  cgi-fcgi -bind -connect 127.0.0.1:9000 || exit 1
