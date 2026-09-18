/**
 * Điều khoản dịch vụ của phòng khám da liễu, hiển thị ở bước 5 đặt lịch.
 * Nội dung được diễn giải từ Luật Khám bệnh, chữa bệnh 2023 (15/2023/QH15),
 * Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và thông lệ tại các phòng khám da liễu.
 */
export interface TermsSection {
  title: string;
  items: string[];
}

export const CLINIC_TERMS_UPDATED_AT = '01/09/2026';

export const CLINIC_TERMS: TermsSection[] = [
  {
    title: 'Phạm vi dịch vụ',
    items: [
      'Phòng khám Da liễu (123 Đường Láng, Đống Đa, Hà Nội) cung cấp dịch vụ khám, chẩn đoán và điều trị các bệnh lý về da, tóc, móng như mụn trứng cá, viêm da cơ địa, nấm da, vảy nến, mề đay, rối loạn sắc tố.',
      'Các thủ thuật da liễu thẩm mỹ (laser, peel da, lăn kim, tiêm, tiểu phẫu...) chỉ được thực hiện khi có chỉ định của bác sĩ sau khi thăm khám.',
      'Lịch đặt trực tuyến là lịch hẹn khám; chẩn đoán và phác đồ điều trị chỉ được đưa ra sau khi bác sĩ trực tiếp khám.',
    ],
  },
  {
    title: 'Đặt lịch, đến khám và đổi/hủy lịch',
    items: [
      'Vui lòng đến trước giờ hẹn 10–15 phút để làm thủ tục tiếp đón, mang theo giấy tờ tùy thân và kết quả khám, đơn thuốc cũ (nếu có).',
      'Bạn có thể xem, đổi hoặc hủy lịch trong mục "Lịch hẹn của tôi". Hãy hủy sớm nếu không thể đến để nhường lịch cho người bệnh khác.',
      'Nếu đến muộn quá ca khám đã chọn, phòng khám có thể sắp xếp sang ca khác hoặc đề nghị bạn đặt lịch mới.',
    ],
  },
  {
    title: 'Trách nhiệm khai báo của người bệnh',
    items: [
      'Khai báo trung thực tiền sử dị ứng (thuốc, mỹ phẩm, thực phẩm), các bệnh nền và thuốc đang sử dụng — đặc biệt là isotretinoin, corticoid, kháng sinh, thuốc chống đông.',
      'Thông báo cho bác sĩ nếu đang mang thai, dự định mang thai hoặc đang cho con bú, vì nhiều thuốc và thủ thuật da liễu chống chỉ định trong các trường hợp này.',
      'Không trang điểm, không tự bôi thuốc hoặc sản phẩm lạ lên vùng da cần khám trong ngày khám để bác sĩ đánh giá chính xác tổn thương.',
      'Tuân thủ phác đồ, hướng dẫn chăm sóc da và lịch tái khám mà bác sĩ đưa ra.',
    ],
  },
  {
    title: 'Thủ thuật và sự đồng ý điều trị',
    items: [
      'Trước mỗi thủ thuật, bác sĩ sẽ giải thích mục đích, cách thực hiện, rủi ro có thể gặp và phương án thay thế. Thủ thuật chỉ được tiến hành sau khi người bệnh ký phiếu đồng ý.',
      'Người bệnh chưa đủ 18 tuổi hoặc không đủ năng lực hành vi dân sự cần có người đại diện hợp pháp đi cùng và ký đồng ý.',
      'Người bệnh có quyền từ chối hoặc dừng điều trị bất kỳ lúc nào; bác sĩ sẽ tư vấn về các ảnh hưởng có thể xảy ra.',
    ],
  },
  {
    title: 'Kết quả điều trị',
    items: [
      'Kết quả điều trị phụ thuộc vào cơ địa, mức độ bệnh và việc tuân thủ phác đồ, vì vậy phòng khám không cam kết một kết quả tuyệt đối hay thời gian khỏi bệnh cố định.',
      'Một số phản ứng có thể gặp sau điều trị như đỏ da, bong tróc, châm chích, tăng sắc tố sau viêm sẽ được bác sĩ tư vấn trước. Hãy liên hệ phòng khám ngay khi có dấu hiệu bất thường.',
    ],
  },
  {
    title: 'Hình ảnh và dữ liệu cá nhân',
    items: [
      'Thông tin sức khỏe là dữ liệu cá nhân nhạy cảm và được bảo mật theo quy định; chỉ nhân viên y tế liên quan trực tiếp đến việc khám chữa bệnh mới được truy cập.',
      'Ảnh chụp vùng da tổn thương chỉ dùng để lưu hồ sơ bệnh án và theo dõi tiến triển điều trị. Phòng khám không sử dụng hình ảnh của bạn cho mục đích quảng cáo khi chưa có sự đồng ý bằng văn bản.',
      'Bạn có quyền xem, yêu cầu chỉnh sửa thông tin cá nhân và yêu cầu cung cấp bản tóm tắt hồ sơ bệnh án của mình.',
    ],
  },
  {
    title: 'Chi phí và thanh toán',
    items: [
      'Chi phí được tính theo bảng giá niêm yết của phòng khám tại thời điểm khám. Voucher (nếu có) được hệ thống tính lại khi xác nhận đặt lịch.',
      'Các dịch vụ, xét nghiệm hoặc thuốc phát sinh theo chỉ định của bác sĩ sẽ được thông báo chi phí trước khi thực hiện.',
    ],
  },
  {
    title: 'Căn cứ pháp lý',
    items: [
      'Luật Khám bệnh, chữa bệnh số 15/2023/QH15.',
      'Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
    ],
  },
];
