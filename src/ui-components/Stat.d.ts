
import * as React from 'react';

import { FlexProps, TextProps, BadgeProps } from '@aws-amplify/ui-react';

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

export declare type StatOverridesProps = {
  'Sales'?: PrimitiveOverrideProps<TextProps>;
  '8,260'?: PrimitiveOverrideProps<TextProps>;
  'Badge'?: PrimitiveOverrideProps<BadgeProps>;
  'Frame 424'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type StatProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: StatOverridesProps | undefined | null;
}>;

export default function Stat(props: StatProps): React.ReactElement;
  