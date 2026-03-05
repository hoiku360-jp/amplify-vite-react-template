
import * as React from 'react';
import { MyIconProps } from "./MyIcon";
import { FlexProps, ImageProps, TextProps, RatingProps, BadgeProps, DividerProps, IconProps } from '@aws-amplify/ui-react';

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

export declare type ProductCardOverridesProps = {
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Classic Long Sleeve T-Shirt'?: PrimitiveOverrideProps<TextProps>;
  'Rating'?: PrimitiveOverrideProps<RatingProps>;
  '72'?: PrimitiveOverrideProps<TextProps>;
  'Ratings'?: PrimitiveOverrideProps<FlexProps>;
  'Badge29766804'?: PrimitiveOverrideProps<BadgeProps>;
  'Badge29766805'?: PrimitiveOverrideProps<BadgeProps>;
  'Badge29766806'?: PrimitiveOverrideProps<BadgeProps>;
  'Tags'?: PrimitiveOverrideProps<FlexProps>;
  'Information about this product.'?: PrimitiveOverrideProps<TextProps>;
  'MyIcon'?: MyIconProps;
  '“This is a quote.“'?: PrimitiveOverrideProps<TextProps>;
  'Quote'?: PrimitiveOverrideProps<FlexProps>;
  'Divider'?: PrimitiveOverrideProps<DividerProps>;
  'Vector29766815'?: PrimitiveOverrideProps<IconProps>;
  'Icon29766814'?: PrimitiveOverrideProps<FlexProps>;
  'Fast'?: PrimitiveOverrideProps<TextProps>;
  'Feature29766813'?: PrimitiveOverrideProps<FlexProps>;
  'Vector29766819'?: PrimitiveOverrideProps<IconProps>;
  'Icon29766818'?: PrimitiveOverrideProps<FlexProps>;
  'Fun'?: PrimitiveOverrideProps<TextProps>;
  'Feature29766817'?: PrimitiveOverrideProps<FlexProps>;
  'Vector29766823'?: PrimitiveOverrideProps<IconProps>;
  'Icon29766822'?: PrimitiveOverrideProps<FlexProps>;
  'Flirty'?: PrimitiveOverrideProps<TextProps>;
  'Feature29766821'?: PrimitiveOverrideProps<FlexProps>;
  'Features'?: PrimitiveOverrideProps<FlexProps>;
  'Card Area'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type ProductCardProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: ProductCardOverridesProps | undefined | null;
}>;

export default function ProductCard(props: ProductCardProps): React.ReactElement;
  