# Use Case UC-01 — Checkout & Thanh toán không tiền mặt

## 1. Thông tin chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Mã** | UC-01 |
| **Tên** | Checkout và thanh toán không tiền mặt |
| **Actors** | Customer (chính), Mock Payment Gateway (phụ) |
| **Liên kết FR** | FR-04, FR-05, FR-06, FR-08, FR-09 |
| **Liên kết NFR** | NFR-01, NFR-02, NFR-06 |

## 2. Trigger

Customer đang ở trang Giỏ hàng (`/cart`) có ≥ 1 sản phẩm và bấm **“Tiến hành thanh toán”**.

## 3. Preconditions

- Giỏ hàng không rỗng.
- Customer đã đăng nhập (có JWT hợp lệ) — hoặc hệ thống yêu cầu đăng nhập trước khi tạo order.
- Backend và mock payment service đang hoạt động.
- Sản phẩm trong giỏ còn tồn kho đủ (nếu có kiểm soát stock).

## 4. Postconditions (thành công)

- Order được tạo với status **PAID**.
- Payment record được lưu với idempotencyKey.
- (Nếu có) Loyalty points được cộng cho user.
- Customer thấy màn hình xác nhận (mã đơn, trạng thái PAID).
- Giỏ hàng được xóa hoặc đánh dấu đã checkout.

## 5. Happy Path

1. Customer bấm “Tiến hành thanh toán” từ `/cart`.
2. Hệ thống kiểm tra đăng nhập; nếu chưa → chuyển tới form đăng nhập/đăng ký (FR-04).
3. Customer chọn phương thức thanh toán: **Ví điện tử** hoặc **Thẻ**.
4. Hệ thống gọi `POST /orders` với nội dung giỏ → tạo order status **PENDING**, trả `orderId`.
5. Hệ thống gọi `POST /payments` kèm `orderId`, `amount`, `method`, `Idempotency-Key`.
6. Mock Payment Gateway trả về **SUCCESS**.
7. Hệ thống cập nhật order **PENDING → PAID** (FR-08).
8. (Optional) Cộng loyalty points (FR-09).
9. Hệ thống trả về mã đơn + trạng thái; Frontend hiển thị màn hình xác nhận.
10. Customer có thể về menu hoặc xem lịch sử đơn.

## 6. Alternate Flows

### A1 — Thanh toán thất bại, retry cùng Idempotency-Key
1. Ở bước 6, Mock Gateway trả **FAILED**.
2. Order chuyển **PAYMENT_FAILED** (hoặc giữ PENDING tùy thiết kế).
3. Giỏ hàng **không** bị xóa.
4. Customer có thể bấm thanh toán lại với **cùng Idempotency-Key** → hệ thống không tạo payment/order trùng (FR-06).
5. Hoặc Customer đổi phương thức (Ví ↔ Thẻ) và thử lại.

### A2 — Customer chưa đăng nhập
1. Khi bấm thanh toán, hệ thống phát hiện không có JWT.
2. Chuyển hướng tới `/login` (hoặc modal đăng nhập).
3. Sau đăng nhập thành công, quay lại luồng checkout (giỏ vẫn còn nhờ persist).

## 7. Exception Flows

### E1 — Hết hàng / vượt tồn kho
- Khi `POST /orders`, server phát hiện stock không đủ.
- Trả lỗi 409/400; không tạo order.
- Frontend hiển thị thông báo; Customer điều chỉnh giỏ.

### E2 — Order không tồn tại hoặc đã PAID
- `POST /payments` với `orderId` không tồn tại hoặc đã PAID.
- Hệ thống từ chối; không tạo payment mới.

### E3 — Idempotency-Key trùng nhưng payload khác
- Hệ thống phát hiện conflict; trả lỗi phù hợp (409).
- Không ghi đè payment trước đó.

### E4 — Mất kết nối / timeout tới mock gateway
- Frontend/Backend xử lý timeout; order có thể ở PENDING hoặc PAYMENT_FAILED.
- Customer được hướng dẫn thử lại.

## 8. Quy tắc nghiệp vụ liên quan

- Chỉ cho phép transition trạng thái hợp lệ theo State Machine (FR-08).
- Thanh toán phải idempotent theo `Idempotency-Key`.
- Giá cuối cùng được tính/khẳng định phía server (FR-05), không tin hoàn toàn client.
