FROM elixir:1.15.8-otp-26-slim AS builder

ENV MIX_ENV=prod
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mix local.hex --force && \
    mix local.rebar --force

COPY mix.exs mix.lock ./
COPY config config

RUN mix deps.get --only $MIX_ENV
RUN mix deps.compile

COPY lib lib
COPY priv priv
COPY assets assets
COPY rel rel

RUN mix assets.deploy
RUN mix compile
RUN mix release

FROM debian:bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libstdc++6 \
    libncurses6 \
    ca-certificates \
    locales \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=C.UTF-8
WORKDIR /app

RUN useradd --create-home --shell /bin/bash app

COPY --from=builder /app/_build/prod/rel/sifter ./

RUN chown -R app:app /app
USER app

ENV HOME=/app \
    MIX_ENV=prod \
    PHX_SERVER=true \
    PORT=4000

EXPOSE 4000

CMD ["/app/bin/sifter", "start"]