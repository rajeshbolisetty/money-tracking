import type { ChangeEvent, FC } from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';

interface Props {
  className?: string;
  text: string;
  value?: string;
  fileFormats: string;
  onDataParsed: (data: unknown[]) => void;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const FileUpload: FC<Props> = ({
  className,
  text,
  value: _value,
  fileFormats,
  onDataParsed,
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv') {
      alert('Only CSV files are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (!result) return;

      const parsed = Papa.parse(result as string, {
        header: true,
        skipEmptyLines: true,
      });

      onDataParsed(parsed.data as unknown[]);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Button
      className={className}
      color="primary"
      variant="contained"
      component="label"
    >
      {text || ''}
      <VisuallyHiddenInput
        type="file"
        accept={fileFormats}
        onChange={handleChange}
      />
    </Button>
  );
};

export default FileUpload;
