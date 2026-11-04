# BrewLite

BrewLite là ứng dụng đặt cà phê không dùng tiền mặt: khách chọn đồ uống, chọn size/topping, thanh toán bằng ví/thẻ và theo dõi trạng thái đơn. Sản phẩm tối thiểu (MVP) đi từ lúc chọn sản phẩm đến lúc thanh toán.

Đây là bài tập lớn môn **Công nghệ Phần mềm**, Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn (HK I, năm học 2026–2027), làm theo quy trình Agile Scrum.

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Frontend | Next.js (App Router), TypeScript, TailwindCSS, Zustand |
| Backend | NestJS (TypeScript), REST API, JWT |
| Cơ sở dữ liệu | PostgreSQL 16, Prisma ORM |
| Triển khai | Docker, Docker Compose |

## Cấu trúc thư mục

```
brewlite/
├── docker-compose.yml     # Chạy cả 3 service: db, backend, frontend
├── .env.example           # Biến môi trường mẫu cho Docker Compose
├── .env                   # Biến môi trường thật (KHÔNG commit)
├── backend/               # NestJS API
│   ├── Dockerfile
│   ├── prisma/            # schema.prisma, migrations/, seed.ts
│   └── src/
├── frontend/              # Next.js app
│   ├── Dockerfile
│   ├── public/
│   └── src/               # app/, components/, lib/, store/, types/
└── README.md
```

`frontend/` và `backend/` có `package.json` riêng, không dùng chung.

## Cách 1: Chạy bằng Docker Compose (khuyên dùng)

Chỉ cần cài **Docker Desktop**, không cần cài Node.js hay PostgreSQL. Mở Docker Desktop và đợi engine báo **Engine running** trước khi chạy lệnh.

### Bước 1: Clone repo

```bash
git clone https://github.com/FlashVN010/brewlite.git
cd brewlite
```

### Bước 2: Tạo file `.env`

```bash
# Windows (PowerShell / CMD)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Mở `.env` và điền giá trị:

```dotenv
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<mật khẩu của bạn>
POSTGRES_DB=myapp
JWT_SECRET=<chuỗi ngẫu nhiên>

# URL mà TRÌNH DUYỆT dùng để gọi backend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Tạo chuỗi ngẫu nhiên cho `JWT_SECRET` và mật khẩu (nên dùng chuỗi hex để không có ký tự đặc biệt):

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### Bước 3: Build và chạy

```bash
docker compose up -d --build
```

Lần đầu mất vài phút. Backend tự áp dụng migration khi khởi động. Kiểm tra trạng thái:

```bash
docker compose ps
docker compose logs -f backend
```

Cần thấy `app_db` ở trạng thái `healthy`, `app_backend` và `app_frontend` ở trạng thái `Up`.

### Bước 4: Nạp dữ liệu mẫu (chỉ làm một lần)

```bash
docker compose exec backend npx prisma db seed
```

Seed chạy lặp lại được, không tạo dữ liệu trùng.

### Bước 5: Sử dụng

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001 (ví dụ `GET /products`)
- Tài khoản mẫu: `demo@brewlite.vn` / `BrewLite123!` (hoặc `customer@brewlite.vn` cùng mật khẩu)

### Lệnh thường dùng

```bash
docker compose up -d              # chạy
docker compose up -d --build      # chạy và build lại khi sửa code
docker compose logs -f backend    # xem log backend (đổi tên service để xem phần khác)
docker compose down               # dừng, giữ dữ liệu DB
docker compose down -v            # dừng và XÓA toàn bộ dữ liệu DB
```

## Cách 2: Chạy dev thủ công (không dùng Docker cho app)

Yêu cầu: Node.js 20 trở lên, npm 10 trở lên, Git, và một PostgreSQL đang chạy (có thể chạy riêng container DB bằng Docker).

> Windows PowerShell: nếu `npm` báo "running scripts is disabled", chạy một lần
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` rồi mở lại terminal.

### Cài đặt

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Biến môi trường

`backend/.env`

```dotenv
PORT=3001
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://postgres:<mật khẩu>@localhost:5432/myapp?schema=public
```

`frontend/.env.local`

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Khởi tạo CSDL

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### Chạy dev

Mở hai terminal:

```bash
# Terminal 1 — backend, cổng 3001
cd backend
npm run start:dev

# Terminal 2 — frontend, cổng 3000
cd frontend
npm run dev
```

Backend đã bật CORS cho `http://localhost:3000`.

### Chạy test backend

```bash
cd backend
npm test
```

## Làm việc với CSDL (Prisma)

Khi sửa `backend/prisma/schema.prisma`, tạo migration mới:

```bash
cd backend
npx prisma migrate dev --name <ten_thay_doi>
```

Sau đó **commit thư mục `backend/prisma/migrations/`**. Nếu thiếu migration, máy khác sẽ không có bảng trong DB.

Nếu dùng DB trong Docker để tạo migration, mở tạm cổng DB trong `docker-compose.yml` (xóa sau khi xong):

```yaml
  db:
    ports:
      - "5433:5432"
```

Rồi dùng `localhost:5433` trong `DATABASE_URL` khi chạy lệnh trên máy. Dùng cổng 5433 thay vì 5432 để tránh trùng với PostgreSQL cài sẵn trên máy.



## Xử lý lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `failed to connect to the docker API ... dockerDesktopLinuxEngine` | Docker Desktop chưa chạy. Mở Docker Desktop, đợi Engine running. Nếu vẫn lỗi: `wsl --update`, `wsl --shutdown`, mở lại Docker Desktop |
| `P1000: Authentication failed` khi chạy Prisma từ máy | Cổng 5432 bị PostgreSQL cài sẵn chiếm. Dùng cổng 5433 như hướng dẫn ở trên |
| Đổi `POSTGRES_PASSWORD` mà backend báo sai mật khẩu | Postgres chỉ đọc mật khẩu lúc tạo volume. Chạy `docker compose down -v` rồi `up` lại (mất dữ liệu), hoặc dùng `ALTER USER` trong DB |
| Đổi `NEXT_PUBLIC_API_URL` không có tác dụng | Biến này được cố định lúc build: chạy `docker compose up -d --build frontend` |
| Backend liên tục `Restarting` | Xem `docker compose logs backend` để biết lỗi cụ thể |
| Menu trống, F12 báo CORS | Kiểm tra backend có bật CORS cho `http://localhost:3000` |
| Ảnh sản phẩm 404 | Đặt ảnh vào `frontend/public/images/` đúng tên theo `prisma/seed.ts` |
| Cổng 3000/3001 đã được dùng | Chạy `docker compose down` ở bản khác đang chạy, hoặc đổi cổng trong `docker-compose.yml` |

## Quy trình Git

- `main`: nhánh ổn định, được bảo vệ, chỉ merge qua Pull Request có ít nhất 1 approve.
- `develop`: nhánh tích hợp chính.
- Mỗi task một nhánh `feature/task-<số>-<mô-tả-ngắn>`, ví dụ `feature/task-1-init-monorepo`, tạo từ `develop` và mở PR vào `develop`.
- Commit theo Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Công việc theo dõi bằng GitHub Issues và Project Board (Backlog / Sprint Backlog / In Progress / In Review / Done).
- Labels: `frontend`, `backend`, `docs`, `setup`, `auth`, `payment`, `bug`, `sprint1`, `sprint2`, `sprint3`.
- Không commit: `.env`, `.env.local`, `node_modules`, `.next`, `dist`.

## Thành viên nhóm

| STT | Họ tên | Vai trò |
|---|---|---|
| 1 | (điền tên) | Product Owner / BA |
| 2 | Ngọc Đại | Scrum Master / QA / DevOps |
| 3 | (điền tên) | Backend Lead |
| 4 | (điền tên) | Backend Auth / Payment |
| 5 | (điền tên) | Frontend Lead |
| 6 | (điền tên) | Frontend UI/UX |
| 7 | Hoàng Duy | Fullstack / Integration |