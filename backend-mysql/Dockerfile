FROM mysql:8.0

COPY railway.cnf /etc/mysql/conf.d/railway.cnf
COPY init.sql /docker-entrypoint-initdb.d/00-init.sql

EXPOSE 3306
