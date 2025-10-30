import { TransformFnParams } from 'class-transformer';
import { ProductSpecificationDto } from 'src/core/product/dtos/product/product-specification.dto';

export function transformSpecificationsString(
  value: string,
): ProductSpecificationDto[] | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const parsedValue = JSON.parse(value);
    if (Array.isArray(parsedValue)) {
      return parsedValue.map((item) => ({
        specificationId: parseInt(item.specificationId, 10),
        value: String(item.value),
      }));
    }
    return undefined;
  } catch (error) {
    console.error('Failed to parse specifications string:', error);
    return undefined;
  }
}
