// FormatType DTOs
export interface CreateFormatTypeDto {
  typeName: string;
  description?: string;
}

export interface UpdateFormatTypeDto {
  typeName?: string;
  description?: string;
}

export interface FormatTypeResponseDto {
  id: number;
  typeName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
