
import * as React from 'react';

import { FlexProps, ImageProps, TextProps, RatingProps, ButtonProps } from '@aws-amplify/ui-react';

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

export declare type ActionCardOverridesProps = {
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Classic Long Sleeve T-Shirt'?: PrimitiveOverrideProps<TextProps>;
  'Information about this product'?: PrimitiveOverrideProps<TextProps>;
  'Main Text'?: PrimitiveOverrideProps<FlexProps>;
  'Rating'?: PrimitiveOverrideProps<RatingProps>;
  '$99 USD'?: PrimitiveOverrideProps<TextProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'Card Area'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type ActionCardProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: ActionCardOverridesProps | undefined | null;
}>;

export default function ActionCard(props: ActionCardProps): React.ReactElement;
  