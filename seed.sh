#!/bin/bash

echo "🌱 Starting complete data seeding..."

echo "📊 Seeding provinces..."
npm run seed:provinces

echo "📊 Seeding trip templates..."
npm run seed:trip-templates

echo "📊 Seeding demo data..."
npm run seed:demo

echo "🎉 All seeding completed successfully!"
echo ""
echo "📋 Demo account:"
echo "   Email: longshare9201@gmail.com"
echo "   Password: demo123"
echo ""
echo "🚀 You can now login and explore the demo trips!"