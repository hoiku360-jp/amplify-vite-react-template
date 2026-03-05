
import * as React from 'react';

import { FlexProps, ImageProps, TextProps } from '@aws-amplify/ui-react';

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

export declare type TallCardOverridesProps = {
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Classic Long Sleeve T-Shirt'?: PrimitiveOverrideProps<TextProps>;
  '$99'?: PrimitiveOverrideProps<TextProps>;
  'Text Grouping'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type TallCardProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: TallCardOverridesProps | undefined | null;
}>;

export default function TallCard(props: TallCardProps): React.ReactElement;
  