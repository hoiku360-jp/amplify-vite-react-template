
import * as React from 'react';

import { ViewProps, FlexProps, IconProps } from '@aws-amplify/ui-react';

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

export declare type LogoWithTextOverridesProps = {
  'Union'?: PrimitiveOverrideProps<IconProps>;
  'Vector39193044'?: PrimitiveOverrideProps<IconProps>;
  'Vector39193045'?: PrimitiveOverrideProps<IconProps>;
  'logo'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type LogoWithTextProps = React.PropsWithChildren<Partial<ViewProps> & {
  color?: 'neutral' | 'brand';
  overrides?: LogoWithTextOverridesProps | undefined | null;
}>;

export default function LogoWithText(props: LogoWithTextProps): React.ReactElement;
  