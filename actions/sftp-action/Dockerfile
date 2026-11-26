FROM rust:1.96-alpine AS builder

# musl-dev for the musl headers; the rest is the C toolchain aws-lc-rs
# (pulled in transitively by russh) compiles AWS-LC with. aws-lc-rs ships
# pre-generated bindings, so no CMake/bindgen/Go is needed — only a C
# compiler, make and perl.
RUN apk add --no-cache musl-dev gcc make perl

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

FROM alpine:3.23

COPY --from=builder /app/target/release/sftp-action /sftp-action

CMD ["/sftp-action"]
