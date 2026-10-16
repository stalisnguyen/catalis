# Catalis - Stalis's IELTS

App luyện IELTS (Academic và General Training, band 4.5 - 9) cho cả nhóm, cùng mèo cam Jack (Mít). Cùng khung với Stalong (repo `stalisnguyen/hanyu`).

## Cấu trúc
- `src/shell.html`, `src/app.css`, `src/app.js` (lõi: dữ liệu, tiến độ, đồng bộ, giọng đọc, thẻ từ, từ điển)
- `src/features/*.js|css`: các module (xem `src/features/README.md`)
  - `05-mascot` Jack (Mít), `10-plan` XP, danh hiệu, lộ trình, xếp lớp, sổ lỗi, mẹo mỗi ngày
  - `20-listen`, `25-read`, `30-write`, `35-speak`, `50-test` (thi thử)
  - `40-grammar`, `45-pron`, `55-games`, `60-ui`, `65-friends`
- `build.py` -> `index.html`. Chạy `python3 build.py` sau mỗi lần sửa `src/`.
- `data/`: nội dung đã đóng gói, tạo bằng `python3 tools/build_data.py` từ `content/out`.
- `content/`: nội dung gốc, spec (`CONTENT_SPEC.md`, `VOCAB_SPEC.md`) và script kiểm tra.
- `api/`: `ai.js` (Groq), `sync.js` (tiến độ theo tên + PIN), `board.js` (bảng Bạn học), `status.js`, `tts.js` (giọng Azure, tùy chọn).
- `tools/smoke.py`: test headless mọi màn ở khổ 390px và 1200px.

## Biến môi trường trên Vercel
- `APP_PASSWORD`: mật khẩu nhóm
- `GROQ_API_KEY`: trợ lý AI (chấm Writing, Speaking, giám khảo AI)
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`: Upstash Redis (khóa có tiền tố `catalis:`, dùng chung database với Stalong được)
- Tùy chọn: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` (giọng đọc neural Anh, Úc, Mỹ)

## Nguồn
- Danh sách từ: New General Service List và New Academic Word List (Browne, Culligan, Phillips), CC BY-SA 4.0.
- Phiên âm tham khảo: open-dict-data/ipa-dict (MIT).
- Đề luyện, bài mẫu, giải thích do Catalis tự soạn theo định dạng IELTS, không lấy từ đề thi thật. Một số dữ kiện trong bài đọc, bài nghe viết theo hiểu biết chung, chưa đối chiếu nguồn.
- Bảng quy đổi điểm sang band là bảng tham khảo phổ biến, chỉ mang tính ước lượng.
