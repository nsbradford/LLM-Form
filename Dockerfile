# Use the specified image
# this had trouble with the `yarn install`
FROM node:18.15.0-bullseye-slim

WORKDIR /app

# necessary for some of the npm packages
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    make \
    g++ \
    git

# https://docs.doppler.com/docs/install-cli
RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl gnupg && \
    curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
    apt-get update && \
    apt-get -y install doppler

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the project files into the working directory
COPY . .
