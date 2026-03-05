
import * as React from 'react';

import { FlexProps, ImageProps, TextProps, IconProps, DividerProps, BadgeProps, RatingProps } from '@aws-amplify/ui-react';

export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;

export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};

export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;

export declare type ReviewCardOverridesProps = {
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Information about this product'?: PrimitiveOverrideProps<TextProps>;
  'Vector'?: PrimitiveOverrideProps<IconProps>;
  'Icon'?: PrimitiveOverrideProps<FlexProps>;
  'Frame'?: PrimitiveOverrideProps<FlexProps>;
  'Classic Long Sleeve T-Shirt'?: PrimitiveOverrideProps<TextProps>;
  'Title'?: PrimitiveOverrideProps<FlexProps>;
  'Divider'?: PrimitiveOverrideProps<DividerProps>;
  'Information about this product.29766836'?: PrimitiveOverrideProps<TextProps>;
  'Information about this product.29766837'?: PrimitiveOverrideProps<TextProps>;
  'Features'?: PrimitiveOverrideProps<FlexProps>;
  'Badge'?: PrimitiveOverrideProps<BadgeProps>;
  'Rating29766841'?: PrimitiveOverrideProps<RatingProps>;
  'Reviews'?: PrimitiveOverrideProps<TextProps>;
  'Rating29766840'?: PrimitiveOverrideProps<FlexProps>;
  '$99/Night'?: PrimitiveOverrideProps<TextProps>;
  'Bottom Row'?: PrimitiveOverrideProps<FlexProps>;
  'Card Area'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type ReviewCardProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: ReviewCardOverridesProps | undefined | null;
}>;

export default function ReviewCard(props: ReviewCardProps): React.ReactElement;
  