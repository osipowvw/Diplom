# syntax=docker/dockerfile:1.4
################################################################################
# 1) Собираем локальный wheelhouse под ту же платформу (Python 3.11 on Linux)
################################################################################
FROM python:3.11-slim AS builder
WORKDIR /wheelbuilder

# нужны компиляторы для сборки колёс
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# копируем только манифест зависимостей
COPY messenger_project/requirements.txt .

# собираем все колесики в /wheelhouse
RUN pip install --upgrade pip wheel \
 && pip wheel -r requirements.txt -w /wheelhouse

################################################################################
# 2) Финальный образ с уже готовыми колёсами — устанавливаться будет "офлайн"
################################################################################
FROM python:3.11-slim
WORKDIR /app

# только runtime–зависимости
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# копируем папку с собранными колесами
COPY --from=builder /wheelhouse ./wheelhouse

# копируем requirements, чтобы pip понял, что ставить
COPY messenger_project/requirements.txt .

# ставим зависимости из wheelhouse
RUN pip install --upgrade pip \
 && pip install --no-index --find-links=./wheelhouse -r requirements.txt

# копируем manage.py из корня и сам пакет
COPY manage.py .
COPY messenger_project ./messenger_project

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && daphne -b 0.0.0.0 -p 8000 messenger_project.asgi:application"]
