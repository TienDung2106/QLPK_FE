import { FileSpreadsheet } from 'lucide-react';
import { saveFile } from '../../api/helpers';
import type { ApiResult, FileDownload } from '../../api/helpers';
import { useAction } from '../hooks';
import { useToast } from './toastContext';
import { Button } from './ui';

interface ExportButtonProps {
  /** Gọi endpoint `/export` với đúng bộ lọc đang áp trên màn hình. */
  download: () => Promise<ApiResult<FileDownload>>;
  /** Tên dự phòng khi backend không gửi Content-Disposition. */
  fileName: string;
  disabled?: boolean;
}

/** Nút "Xuất Excel" dùng chung: tải tệp .xlsx, lỗi (vd quá 5000 dòng) hiện thành toast. */
export const ExportButton = ({ download, fileName, disabled }: ExportButtonProps) => {
  const { run, isPending } = useAction();
  const toast = useToast();

  return (
    <Button
      icon={<FileSpreadsheet size={15} />}
      loading={isPending('export')}
      disabled={disabled}
      onClick={async () => {
        const result = await run('export', download);
        if (result.ok && result.data) {
          saveFile(result.data, fileName);
        } else {
          toast.error(result.error);
        }
      }}
    >
      Xuất Excel
    </Button>
  );
};
