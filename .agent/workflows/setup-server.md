---
description: How to setup Docker and Docker Compose on Ubuntu server
---
# Server Setup: Docker & Docker Compose

Follow these steps to install Docker and Docker Compose on your Ubuntu server to prepare it for deployment.

### 1. Update and install basic dependencies
```bash
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt install curl -y
sudo apt update -y
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
```

### 2. Add Docker's official GPG key and repository
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
sudo apt update -y
```

### 3. Install Docker Engine
```bash
sudo apt-cache policy docker-ce -y
sudo apt install docker-ce -y
```

### 4. Install Docker Compose (Standalone v2.2.3)
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.2.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose
docker-compose --version
```

### 5. Post-installation steps (Non-root user)
```bash
sudo usermod -aG docker ${USER}
# Note: You may need to logout and login again for group changes to take effect
sudo systemctl start docker
```
