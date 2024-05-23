# Realworld Example

This is a full-stack implementation of the [Realworld Example](https://realworld-docs.netlify.app/).

## Prerequistes

- [Node 18+](https://github.com/nvm-sh/nvm)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [PNPM](https://pnpm.io/installation)

## Getting started

### Build the packages

Because the project is linked up to local packages via `workspace:*`, it is necessary to build the Typed packages before running this example.

```sh
# Install all dependencies
pnpm -w install
# Build all @typed packages
pnpm -w build
```

### Running Realworld Example

You'll need two terminals. In the first terminal start the supporting docker containers:

```sh
docker-compose up
```

This will setup the database and setup Prometheus/Grafana for collecting OpenTelemetry data.

In the second terminal, run the following to start the server.

```sh
# Development server
pnpm start

# OR

# Production server
pnpm build && pnpm preview
```

## PORTS

- Development Server :: Port 5173
- Production Server :: Port 3000
- OpenTelemetry :: Port 9091
