# BrewLite

BrewLite là ứng dụng đặt cà phê không dùng tiền mặt: khách chọn đồ uống, chọn size/topping, thanh toán bằng ví/thẻ và theo dõi trạng thái đơn. Sản phẩm tối thiểu (MVP) đi từ lúc chọn sản phẩm đến lúc thanh toán.

Đây là bài tập lớn môn **Công nghệ Phần mềm**, Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn (HK I, năm học 2026–2027), làm theo quy trình Agile Scrum.

- Frontend: Next.js (App Router), TypeScript, TailwindCSS
- Backend: NestJS (TypeScript), REST API

## Yêu cầu hệ thống

- Node.js 20 trở lên
- npm 10 trở lên
- Git

Kiểm tra nhanh: `node -v`, `npm -v`, `git --version`.

> Windows PowerShell: nếu `npm` báo "running scripts is disabled", chạy một lần
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` rồi mở lại terminal.

## Cấu trúc thư mục

```
brewlite/
├── frontend/              # Next.js app (Task 3–5, 8–9)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.local         # Không commit
├── backend/               # NestJS API (Task 2, 6–8, 10)
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── .env               # Không commit
├── .gitignore             # Ignore chung cho cả repo
├── .env.example           # Biến môi trường mẫu
└── README.md              # Hướng dẫn cài đặt & chạy
```

Mỗi thư mục `frontend/` và `backend/` có `package.json` riêng, không dùng chung.

## Cài đặt

```bash
git clone https://github.com/FlashVN010/brewlite.git
cd brewlite
cd frontend && npm install
cd ../backend && npm install
```

## Biến môi trường

File `.env.example` ở thư mục gốc chứa biến mẫu cho cả hai phần. Tạo hai file thật (không commit) rồi chép các dòng tương ứng vào:

`backend/.env`

```
PORT=3001
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://user:pass@localhost:5432/brewlite
```

`frontend/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`DATABASE_URL` chỉ là giá trị mẫu; chưa có kết nối CSDL thật ở Task 1.

## Chạy dev

Mở hai terminal:

```bash
# Terminal 1 — backend, cổng 3001
cd backend
npm run start:dev

# Terminal 2 — frontend, cổng 3000
cd frontend
npm run dev
```

- Frontend: http://localhost:3000 (trang mặc định của Next.js)
- Backend: http://localhost:3001 (hiện `Hello World!`)

Backend đã bật CORS cho `http://localhost:3000`, nên frontend gọi được API.

## Chạy test backend

```bash
cd backend
npm test
```

## Quy trình Git
- `main`: nhánh ổn định, được bảo vệ, chỉ merge qua Pull Request có ít nhất 1 approve.
- `develop`: nhánh tích hợp chính.
- Mỗi task một nhánh `feature/task-<số>-<mô-tả-ngắn>`, ví dụ `feature/task-1-init-monorepo`, tạo từ `develop` và mở PR vào `develop`.
- Commit theo Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Công việc theo dõi bằng GitHub Issues và Project Board (Backlog / Sprint Backlog / In Progress / In Review / Done).
- Labels: `frontend`, `backend`, `docs`, `setup`, `auth`, `payment`, `bug`, `sprint1`, `sprint2`, `sprint3`.

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

