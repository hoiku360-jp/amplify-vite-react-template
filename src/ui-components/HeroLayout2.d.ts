
import * as React from 'react';

import { FlexProps, TextProps, ButtonProps } from '@aws-amplify/ui-react';

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

export declare type HeroLayout2OverridesProps = {
  'Full stack'?: PrimitiveOverrideProps<TextProps>;
  'Build full-stack web and mobile apps in hours. Easy to start, easy to scale'?: PrimitiveOverrideProps<TextProps>;
  'AWS Amplify is a complete solution that lets frontend web and mobile developers easily build, ship, and host full-stack applications on AWS, with the flexibility to leverage the breadth of AWS services as use cases evolve. No cloud expertise needed.'?: PrimitiveOverrideProps<TextProps>;
  'Main Body'?: PrimitiveOverrideProps<FlexProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'Type Lock Up'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type HeroLayout2Props = React.PropsWithChildren<Partial<FlexProps> & {
  colorMode?: 'Default' | 'dark';
  overrides?: HeroLayout2OverridesProps | undefined | null;
}>;

export default function HeroLayout2(props: HeroLayout2Props): React.ReactElement;
  