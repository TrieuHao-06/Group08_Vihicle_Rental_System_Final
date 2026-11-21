FROM node:20-alpine

# Đặt thư mục làm việc bên trong container
WORKDIR /app

# Copy package.json và package-lock.json trước để tận dụng Docker cache layer
COPY package*.json ./

# Cài đặt dependencies (chỉ tải các thư viện cần thiết)
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Khai báo port ứng dụng sử dụng (mặc định server chạy port 3000)
EXPOSE 3000

# Lệnh khởi chạy server Node.js
CMD ["npm", "start"]
