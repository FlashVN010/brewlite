# Software Requirements Specification (SRS) — BrewLite

## 1. Functional Requirements

| Mã | Chức năng | MoSCoW | Mô tả ngắn | Endpoint / UI liên quan | Acceptance Criteria (tóm tắt) | Trạng thái |
|----|-----------|--------|------------|--------------------------|-------------------------------|------------|
| **FR-01** | Xem menu | Must | Hiển thị danh sách đồ uống (ảnh, tên, giá) | `GET /products` · UI `/` | Có ≥ 1 sản phẩm; loading/empty/error state; giá định dạng vi-VN | Implemented (Task 2, 3) |
| **FR-02** | Chi tiết sản phẩm, size, topping | Must | Xem chi tiết, chọn size S/M/L và topping, tính giá | `GET /products/:id` · UI `/products/[id]` | Chọn size/topping cập nhật giá; nút Thêm vào giỏ | Partial / Task 4 |
| **FR-03** | Giỏ hàng và persist | Must | Thêm/sửa/xóa item; persist localStorage; badge | Zustand store · UI `/cart` | Gộp item trùng (id+size+toppings); ± quantity; disable − khi =1; persist sau F5 | Implemented (Task 5) |
| **FR-04** | Đăng ký / Đăng nhập JWT | Must | Tạo tài khoản, đăng nhập, nhận JWT | `POST /auth/register`, `POST /auth/login` | Hash password (bcrypt); trả JWT; guard bảo vệ route đặt đơn | Task 7 |
| **FR-05** | Tạo order & server-side pricing | Must | Tạo đơn từ giỏ, validate, lưu PENDING, tính tổng phía server | `POST /orders` | Reject giỏ rỗng; trả mã đơn; status=PENDING | Task 6 |
| **FR-06** | Mock payment, idempotency | Must | Thanh toán Ví/Thẻ; idempotent; cập nhật PAID hoặc PAYMENT_FAILED | `POST /payments` | Cùng Idempotency-Key chỉ xử lý 1 lần; success → PAID | Task 8 |
| **FR-07** | Lịch sử order | Must | Xem danh sách đơn của user đang đăng nhập | `GET /orders/me` · UI lịch sử | Chỉ trả đơn của user; có mã, tổng, trạng thái, thời gian | Task 9 |
| **FR-08** | Order state machine | Must | Chuyển trạng thái hợp lệ; chặn transition sai | Backend Order service | PENDING→PAID→PREPARING→READY→COMPLETED; reject transition không hợp lệ | Task 10 |
| **FR-09** | Loyalty (điểm thưởng) | Should | Cộng điểm sau khi đơn PAID | User.loyaltyPoints | Sau PAID điểm tăng theo rule đã định | Task 10 |
| **FR-10** | Promotion / mã giảm giá | Could | Áp mã giảm giá hợp lệ khi checkout | Order / Payment flow | Mã hợp lệ giảm đúng; mã hết hạn/không tồn tại bị từ chối | Task 10 |

### Chi tiết Acceptance Criteria tiêu biểu

**FR-01**
- Given backend có sản phẩm, When mở `/`, Then hiển thị grid sản phẩm trong ≤ 2s.
- Given backend chậm, Then hiện skeleton/loading.
- Given `[]`, Then hiện “Chưa có sản phẩm”.
- Given backend tắt, Then hiện lỗi + nút Thử lại.

**FR-03**
- Given thêm 2 lần cùng productId+size+toppings, Then chỉ 1 dòng, quantity cộng dồn.
- Given quantity=1, When bấm −, Then nút disabled.
- Given có item, When F5, Then giỏ giữ nguyên.

**FR-06**
- Given gửi 2 request cùng Idempotency-Key, Then chỉ 1 lần trừ tiền / cập nhật đơn.
- Given thanh toán thành công, Then order.status = PAID.
- Given thanh toán thất bại, Then status = PAYMENT_FAILED, giỏ giữ nguyên.

**FR-08**
- Given order PAID, When chuyển sang CANCELLED trực tiếp (không qua flow cho phép), Then bị reject.

---

## 2. Non-Functional Requirements

| Mã | Hạng mục | Mô tả | Tiêu chí đo / Kiểm chứng |
|----|----------|-------|---------------------------|
| **NFR-01** | Hiệu năng API | Thời gian phản hồi API < 500ms với dữ liệu mẫu | Đo bằng test/k6 hoặc log; endpoint chính `/products`, `/orders` |
| **NFR-02** | Bảo mật | JWT, bcrypt hash mật khẩu, validate input (class-validator) | Không lưu plain password; route bảo vệ trả 401 khi thiếu/invalid token |
| **NFR-03** | Bí mật cấu hình | Secret/key không commit vào Git | `.env` trong `.gitignore`; có `.env.example` |
| **NFR-04** | Khả dụng / Health | Có health check endpoint | `GET /health` (hoặc tương đương) trả 200 khi service sống |
| **NFR-05** | DevOps | Docker Compose chạy được frontend + backend + DB | `docker-compose up` khởi động đủ 3 service |
| **NFR-06** | Kiểm thử | Có unit / integration test cho logic quan trọng | Test: state transition, idempotency, gộp cart, validate order |
| **NFR-07** | Hiệu năng DB | Index phù hợp cho truy vấn thường dùng | Index trên `Order.userId`, `Order.status`, `Payment.idempotencyKey` |

---

## 3. Truy xuất nguồn (Traceability)

| Requirement | Task / Commit / File liên quan | Ghi chú |
|-------------|-------------------------------|---------|
| FR-01 | Task 2, Task 3 | `GET /products`, `app/page.tsx`, `ProductGrid` |
| FR-02 | Task 4 | Trang chi tiết – có thể chưa merge |
| FR-03 | Task 5 | `store/cartStore.ts`, `app/cart/page.tsx` |
| FR-04 | Task 7 | Auth module NestJS |
| FR-05 | Task 6 | Orders module |
| FR-06 | Task 8 | Payments + mock gateway |
| FR-07 | Task 9 | `GET /orders/me` + UI |
| FR-08–10 | Task 10 | State machine, loyalty, promotion |
| NFR-01–07 | Toàn Sprint | README, docker-compose, test, .env.example |
