FROM node:22-slim

WORKDIR /app

# npm은 Linux용 플랫폼 패키지(rolldown 등)를 자동 처리
# 로컬 개발은 pnpm, Docker 빌드는 npm 사용
COPY package.json ./
RUN npm install --legacy-peer-deps

EXPOSE 5173
CMD ["./node_modules/.bin/vite", "--host"]
