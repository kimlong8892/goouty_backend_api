#!/bin/bash

# Exit on error
set -e

# Check if Docker and Docker Compose are already installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
  echo "Docker or Docker Compose not found. Starting installation..."

  echo "Updating system..."
  sudo apt-get update -y
  sudo apt-get upgrade -y
  sudo apt install curl -y

  echo "Installing dependencies..."
  sudo apt update -y
  sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

  echo "Adding Docker repository..."
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable" -y
  sudo apt update -y

  echo "Installing Docker..."
  sudo apt-cache policy docker-ce -y
  sudo apt install docker-ce -y

  echo "Installing Docker Compose v2.2.3..."
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.2.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
  sudo chmod +x /usr/bin/docker-compose
  docker-compose --version

  echo "Configuring permissions..."
  sudo usermod -aG docker ${USER}
  sudo systemctl start docker

  echo "Setup complete! Please log out and log back in for changes to take effect."
else
  echo "Docker and Docker Compose are already installed."
  docker --version
  docker-compose --version
fi
