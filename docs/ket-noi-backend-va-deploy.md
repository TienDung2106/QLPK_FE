# QLPK_FE — nối backend và deploy lên Azure

Tài liệu này ghi lại cách frontend gọi API, cách đổi giữa backend local và backend trên
server, và cách deploy lên Azure Static Web Apps.

## Kiến trúc gọi API

Ba tầng, sao chép từ `BenhubContractor` (`src/app/apis/*`) và chỉnh cho khớp với QLPK API:

```
src/api/
  httpClient.ts   axios instance. Interceptor request gắn Bearer token, đọc lại từ kho
                  lưu trữ ở MỖI request nên không phải đồng bộ gì sau khi đăng nhập.
                  Interceptor response gặp 401 thì tự gọi /auth/refresh một lần rồi
                  chạy lại request; refresh hỏng thì xoá phiên và báo cho AuthContext.
  helpers.ts      GetData / PostData / PutData / DeleteData / PostNonToken /
                  PostWithCaptcha. Bắt lỗi và trả { ok, status, data, error, errorCode },
                  nên tầng view không try/catch.
  url.ts          Toàn bộ endpoint. Nơi DUY NHẤT biết API nằm ở đâu.
  types.ts        Shape DTO backend trả về, để nguyên snake_case.
  session.ts      Token + tài khoản trong localStorage/sessionStorage.
  functions/      auth, captcha, doctors, services, patients, appointments.
                  Đây là tầng duy nhất mà các trang được phép import.
```

Ba điểm khác với bản dcv2, vì backend khác:

1. **Không có envelope `{code, data}`.** QLPK dùng HTTP status thật và trả lỗi theo
   ProblemDetails (mục 9.5), nên `ok` đọc từ status còn `error` lấy từ `detail`/`errors`.
2. **JSON trên dây là snake_case** (`access_token`, `phone_number`) — do
   `JsonNamingPolicy.SnakeCaseLower` trong `QLPK/Configurations/JsonServiceExtensions.cs`.
3. **Có interceptor refresh token.** dcv2 không có, và đó là lý do ở dự án đó mất mạng bị
   hiểu nhầm thành 401 rồi đá người dùng ra ngoài.

Trạng thái đăng nhập nằm ở `src/contexts/AuthContext.tsx`, đọc qua hook
`src/hooks/useAuth.ts`. Chặn route bằng `src/auth/AuthGuard.tsx` (`AuthGuard` cho trang
cần đăng nhập, `GuestGuard` cho trang khách). **`GuestGuard` là nơi duy nhất quyết định
trang đích sau khi đăng nhập** (`src/auth/landing.ts`) — trang đăng nhập chỉ lưu phiên rồi
thôi, nếu nó cũng tự `navigate` thì hai bên tranh nhau và đích nào thắng là tuỳ thứ tự
render.

## Đổi giữa backend local và backend trên server

**Phía frontend** — `.env.development`, comment một trong hai dòng:

```dotenv
# Đang trỏ tới API đã deploy trên Azure:
VITE_API_ROOT=https://app-qlpk-hoangqlpk97.azurewebsites.net/api
# Đổi sang backend chạy tại máy:
# VITE_API_ROOT=http://localhost:5131/api
```

Sửa xong phải **khởi động lại `npm run dev`** — Vite nhúng biến môi trường lúc khởi động,
không đọc lại khi đang chạy.

Muốn đè riêng cho máy mình mà không sửa file chung, tạo **`.env.development.local`** (không
phải `.env.local`): Vite xếp `.env.[mode]` ưu tiên **cao hơn** `.env.local`, nên khi đã có
`.env.development` thì `.env.local` bị bỏ qua hoàn toàn mà không báo lỗi gì.

`.env.production` luôn trỏ tới API trên Azure; đó là file `npm run build` dùng, tức là bản
deploy lên Static Web Apps.

**Phía backend** — `QLPK/appsettings.json`, mục `Cors:AllowedOrigins`. Trình đọc cấu hình
của ASP.NET Core chấp nhận comment `//`, nên tắt một origin là comment đúng dòng đó:

```jsonc
"Cors": {
  "AllowedOrigins": [
    "http://localhost:5173",                                    // Vite dev
    "https://wonderful-plant-05c95c300.6.azurestaticapps.net"   // Azure Static Web Apps
  ]
}
```

Trên Azure thì hai origin này được đè bằng App Settings, nên sửa file không ảnh hưởng bản
đang chạy cho tới lần deploy kế tiếp:

```bash
az webapp config appsettings set --resource-group rg-qlpk --name app-qlpk-hoangqlpk97 \
  --settings "Cors__AllowedOrigins__0=https://wonderful-plant-05c95c300.6.azurestaticapps.net" \
             "Cors__AllowedOrigins__1=http://localhost:5173"
```

Kiểm tra CORS thật sự có tác dụng (chứ không phải đang mở toang):

```bash
# Origin được phép -> có Access-Control-Allow-Origin
curl -i -X OPTIONS http://localhost:5131/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Origin lạ -> KHÔNG có header đó, trình duyệt sẽ chặn
curl -i -X OPTIONS http://localhost:5131/api/auth/login \
  -H "Origin: https://evil.example" \
  -H "Access-Control-Request-Method: POST"
```

## CAPTCHA

Backend bắt buộc `X-Captcha-Token` ở đăng ký, gửi lại mã, quên mật khẩu và đặt lịch; ở đăng
nhập thì chỉ bắt sau vài lần sai (setting `captcha_after_failed_login_attempts`).

Luồng hai token, đừng nhầm: widget Turnstile sinh **provider token**, đem đổi qua
`POST /api/captcha/verify` mới ra **verification token** — cái sau mới gửi ở header, và
dùng đúng một lần. `src/hooks/useCaptcha.ts` lo toàn bộ vòng đời này.

Site key mặc định `1x00000000000000000000AA` là test key luôn-pass của Cloudflare, khớp với
test secret backend đang dùng. Muốn bật chống bot thật thì đăng ký Turnstile rồi thay
`VITE_TURNSTILE_SITE_KEY` (frontend) và `Captcha__Turnstile__SecretKey` (backend).

## Deploy lên Azure Static Web Apps

| Thành phần | Giá trị |
|---|---|
| Resource group | `rg-qlpk` (dùng chung với backend) |
| Static Web App | `swa-qlpk-hoangqlpk97`, SKU **Free**, region East Asia |
| **URL** | **https://wonderful-plant-05c95c300.6.azurestaticapps.net** |

Hostname do Azure sinh ngẫu nhiên, **không** theo tên resource. Tra lại bằng:

```bash
az staticwebapp show -n swa-qlpk-hoangqlpk97 -g rg-qlpk --query defaultHostname -o tsv
```

### Dựng lại từ đầu

```bash
az staticwebapp create --name swa-qlpk-hoangqlpk97 \
  --resource-group rg-qlpk --location eastasia --sku Free
```

### Tự động deploy bằng GitHub Actions

Workflow ở `.github/workflows/azure-swa-deploy.yml`, chạy khi push vào `main` hoặc `Hoang`
(sửa mục `on.push.branches` nếu dùng nhánh khác), và bấm chạy tay được từ tab Actions.

Cần đúng **một** secret. Lấy giá trị:

```bash
az staticwebapp secrets list --name swa-qlpk-hoangqlpk97 \
  --resource-group rg-qlpk --query properties.apiKey -o tsv
```

rồi thêm vào repo `stayhome3977/QLPK_FE` ở **Settings → Secrets and variables → Actions**
với tên `AZURE_STATIC_WEB_APPS_API_TOKEN`.

### Deploy tay (không cần GitHub)

```bash
npm run build
npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token "$(az staticwebapp secrets list --name swa-qlpk-hoangqlpk97 \
    --resource-group rg-qlpk --query properties.apiKey -o tsv)" \
  --env production
```

### `staticwebapp.config.json`

Bắt buộc với BrowserRouter: `navigationFallback` trả `/index.html` cho mọi đường dẫn không
phải file tĩnh. Thiếu nó thì mở thẳng `/lich-hen-cua-toi` sẽ ra 404 — trang chủ vẫn chạy,
nên lỗi này rất dễ lọt.

## Sự cố thường gặp

**Trình duyệt báo lỗi CORS.** Origin của frontend chưa có trong `Cors:AllowedOrigins`.
Nhớ rằng `http://localhost:5173` và `http://127.0.0.1:5173` là hai origin khác nhau.

**Đổi `.env` mà không thấy tác dụng.** Vite nhúng biến lúc khởi động; phải tắt và chạy lại
`npm run dev`.

**Mở thẳng một đường dẫn con thì ra 404.** Thiếu `staticwebapp.config.json`, hoặc file đó
không được deploy kèm (nó phải nằm ở thư mục `output_location`, hoặc ở gốc repo).

**Đường dẫn asset bị 404 sau khi deploy.** `base` trong `vite.config.ts` phải là `'/'`.
Trước đây là `'/QLPK_FE/'` để đẩy lên GitHub Pages; giữ giá trị cũ thì mọi file JS/CSS sẽ
được tìm ở sai thư mục. Đổi lại cũng có nghĩa là script `npm run deploy` (gh-pages) không
còn dùng được nữa nếu không chỉnh `base` về.

**Ô CAPTCHA không hiện.** Trình chặn quảng cáo chặn `challenges.cloudflare.com`. Ứng dụng
bắt được trường hợp này và hiện lời nhắc, nhưng vẫn không đăng ký được cho tới khi tắt nó.

**Ô CAPTCHA quay "đang xác minh" mãi không dừng.** Tên miền đang mở trang chưa nằm trong
danh sách hostname của widget Turnstile — Cloudflare trả mã `110200`. Thêm tên miền đó
(kể cả `localhost` khi chạy dev) ở Cloudflare → Turnstile → widget → **Hostname Management**.
Ứng dụng thử lại đúng một lần rồi dừng và hiện thẳng thông báo này; nếu nó vẽ lại vô hạn thì
đó là lỗi đã được sửa ở `useCaptcha` (tách `error-callback` khỏi `expired-callback`).
