FROM rust:1.96-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

FROM alpine:3.23

COPY --from=builder /app/target/release/mcp-action /mcp-action

CMD ["/mcp-action"]
