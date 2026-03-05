
import * as React from 'react';

import { FlexProps, TextProps, ButtonProps, ImageProps } from '@aws-amplify/ui-react';

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

export declare type HeroLayout1OverridesProps = {
  'Eyebrow'?: PrimitiveOverrideProps<TextProps>;
  'Heading'?: PrimitiveOverrideProps<TextProps>;
  'Body'?: PrimitiveOverrideProps<TextProps>;
  'Message'?: PrimitiveOverrideProps<FlexProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'HeroMessage'?: PrimitiveOverrideProps<FlexProps>;
  'Left'?: PrimitiveOverrideProps<FlexProps>;
  'image'?: PrimitiveOverrideProps<ImageProps>;
  'Right'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type HeroLayout1Props = React.PropsWithChildren<Partial<FlexProps> & {
  mode?: 'Light' | 'Dark';
  overrides?: HeroLayout1OverridesProps | undefined | null;
}>;

export default function HeroLayout1(props: HeroLayout1Props): React.ReactElement;
  