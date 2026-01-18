#!/bin/bash

# Kiểm tra đang ở trong git repo không
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "❌ Không phải thư mục git"
  exit 1
fi

# Nhập commit message
read -p "Nhập commit message: " MESSAGE

if [ -z "$MESSAGE" ]; then
  echo "❌ Commit message không được để trống"
  exit 1
fi

# Add tất cả thay đổi
git add .

# Commit
git commit -m "$MESSAGE"

# Push lên branch dev
git push origin dev
