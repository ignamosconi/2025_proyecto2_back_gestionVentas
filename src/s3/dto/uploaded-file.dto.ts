//ARCHIVO: uploaded-file.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadedFileDTO {
  @ApiProperty({ example: '1234abcd.jpg' })
  filename: string;

  @ApiProperty({ example: 'https://tu-bucket.s3.us-east-2.amazonaws.com/1234abcd.jpg' })
  url: string;
}