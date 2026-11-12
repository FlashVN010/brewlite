# Context and Scope — BrewLite

## 1. Bối cảnh vấn đề

Khách hàng tại quán cà phê thường phải xếp hàng lâu để đặt và thanh toán bằng tiền mặt. Việc này làm tăng thời gian chờ, giảm trải nghiệm và gây áp lực cho barista trong giờ cao điểm. 
BrewLite giải quyết vấn đề bằng ứng dụng web đặt đồ uống và thanh toán không tiền mặt, giúp khách hoàn tất đơn chỉ trong vài thao tác và nhận đồ nhanh tại quầy.

## 2. Giá trị mang lại

| Bên liên quan | Giá trị |
|---------------|---------|
| **Khách hàng**| Đặt món nhanh, chọn size/topping, thanh toán không tiền mặt, theo dõi trạng thái đơn, giảm thời gian xếp hàng. |
| **Barista / Nhân viên quầy** | Nhận đơn rõ ràng, cập nhật trạng thái pha chế (mở rộng ngoài MVP). |
| **Quản lý / Product Owner** | Ưu tiên backlog, nghiệm thu increment, theo dõi đơn hàng. |
| **Giảng viên nghiệm thu** | Đánh giá quy trình Agile Scrum, sản phẩm MVP và mức đáp ứng tiêu chí chấp nhận. |
| **Nhóm phát triển** | Phân tích, thiết kế, lập trình, kiểm thử và bàn giao hệ thống theo Sprint. |
| **Đơn vị thanh toán (mock)** | Mô phỏng cổng thanh toán Ví/Thẻ trong phạm vi bài tập. |

## 3. Stakeholders

| Stakeholder | Vai trò | Mục tiêu / Kỳ vọng | Mức ảnh hưởng |
|-------------|---------|---------------------|---------------|
| Khách hàng | Người dùng cuối | Đặt & thanh toán nhanh, UI mượt| Cao |
| Barista    | Người vận hành quầy | Nhận đơn, cập nhật trạng thái| Trung bình (ngoài MVP) |
| Product Owner / Quản lý | Quyết định yêu cầu | Ưu tiên backlog, nghiệm thu | Cao |
| Giảng viên | Nghiệm thu | Đánh giá quy trình & sản phẩm | Cao |
| Development Team | Xây dựng hệ thống | Giao MVP đúng DoD | Cao |
| Payment Gateway (mock) | Cổng thanh toán giả lập | Xử lý thanh toán thành công/thất bại | Trung bình |

## 4. Phạm vi (Scope)

### 4.1 In-Scope (MVP)

- Hiển thị menu đồ uống (ảnh, tên, giá).
- Chi tiết sản phẩm: chọn size (S/M/L) và topping.
- Giỏ hàng: thêm / sửa số lượng / xóa, persist qua refresh.
- Đăng ký / đăng nhập (JWT).
- Tạo đơn hàng (PENDING) với validate và tính giá phía server.
- Thanh toán không tiền mặt (mock Ví / Thẻ), idempotent.
- Xác nhận đơn (mã đơn, trạng thái PAID) và lịch sử đơn của user.
- Order State Machine cơ bản: PENDING → PAID → PREPARING → READY → COMPLETED (và các nhánh lỗi/hủy).

### 4.2 Extended Scope (sau MVP)

- Push notification khi đơn READY.
- Loyalty nâng cao (hạng thành viên, đổi điểm lấy quà).
- Dashboard quản lý cho chủ quán / barista.
- Khuyến mãi phức tạp (flash sale, combo).

### 4.3 Out-of-Scope

- Thanh toán thật với cổng Momo/VNPay/Stripe production.
- Tích hợp shipper / giao hàng tận nơi.
- Ứng dụng mobile native (iOS/Android).
- Đa chi nhánh / multi-store.
- Hệ thống kho nguyên liệu chi tiết theo từng nguyên liệu.

## 5. Assumptions

- Người dùng có trình duyệt web hiện đại và kết nối internet.
- Backend (NestJS) và Frontend (Next.js) chạy local hoặc qua Docker Compose.
- Cổng thanh toán được mô phỏng (mock); không cần tài khoản thật.
- Dữ liệu mẫu đủ để demo end-to-end (menu, user, đơn).
- Một user chỉ thao tác trên một phiên đăng nhập tại một thời điểm (không xử lý multi-device phức tạp trong MVP).

## 6. Constraints

- Công nghệ bắt buộc: NestJS (Backend) + Next.js (Frontend) + PostgreSQL.
- Tuân thủ quy trình Agile Scrum (Sprint Planning, Daily, Review, Retrospective).
- MVP phải demo được luồng: Menu → Chi tiết → Giỏ → Đăng nhập → Thanh toán → Xác nhận.
- API response time mục tiêu < 500ms với dữ liệu mẫu.
- Mật khẩu phải hash (bcrypt), JWT bảo vệ route đặt đơn/thanh toán.

## 7. Risks & Mitigation

| Rủi ro | Mức | Mitigation |
|--------|-----|------------|
| Backend chưa sẵn sàng khi Frontend cần API | Cao | Mock data / MSW tạm thời; contract API thống nhất sớm |
| Conflict merge giữa frontend & backend | Trung bình | Branch strategy rõ, PR nhỏ, review bắt buộc |
| Thanh toán mock không phản ánh lỗi thực tế | Trung bình | Định nghĩa rõ các case SUCCESS / FAILED / idempotency trong test |
| Scope creep (thêm tính năng ngoài MVP) | Cao | Bám In-Scope; mọi mở rộng đưa vào Extended/Out-of-Scope |
| Thiếu test cho state machine & concurrent order | Cao | Unit/integration test cho transition và optimistic locking (Task 10) |
