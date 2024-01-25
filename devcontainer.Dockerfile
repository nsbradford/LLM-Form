FROM node:18.15.0-bullseye-slim

# codespaces automatically clones the repo into /workspaces/<repo-name>

# necessary for some of the npm packages
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++

# https://docs.doppler.com/docs/install-cli
RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl gnupg && \
    curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
    apt-get update && \
    apt-get -y install doppler


RUN yarn install --frozen-lockfile

EXPOSE 3000