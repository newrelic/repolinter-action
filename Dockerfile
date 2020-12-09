ARG RUNTIME_DEPS="git libicu-dev perl"
ARG BUILD_DEPS="make build-essential cmake pkg-config zlib1g-dev libcurl4-openssl-dev libssl-dev libldap2-dev libidn11-dev"

FROM ruby:2.6-slim as ruby-deps
ARG RUNTIME_DEPS
ARG BUILD_DEPS

# set to always UTF8
ENV LANG=C.UTF-8

# Install build deps
RUN apt-get update && \
    apt-get install --no-install-recommends -y $RUNTIME_DEPS $BUILD_DEPS && \
    gem update --system --silent

# Install ruby gems
COPY Gemfile* ./
RUN bundle config path vendor/bundle && \
    bundle install --jobs 4 --retry 3

# cleanup
RUN apt-get remove -y $BUILD_DEPS && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

FROM python:2.7-slim as python-deps

# docutils for github-markup
RUN python -m pip install --upgrade pip && \
    pip install docutils

FROM node:lts-slim

# Copy Ruby dependencies
COPY --from=ruby-deps . .
COPY --from=python-deps . .

# Install node_modules
COPY package*.json ./
RUN npm install --production

# move the rest of the project over
COPY dist dist

ENTRYPOINT ["bundle", "exec", "dist/index.js"]
