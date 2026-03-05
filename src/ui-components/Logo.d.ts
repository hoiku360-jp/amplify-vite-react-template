
import * as React from 'react';

import { FlexProps, IconProps } from '@aws-amplify/ui-react';

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

export declare type LogoOverridesProps = {
  'Union'?: PrimitiveOverrideProps<IconProps>;
} & EscapeHatchProps;

export declare type LogoProps = React.PropsWithChildren<Partial<FlexProps> & {
  color?: 'neutral' | 'brand';
  overrides?: LogoOverridesProps | undefined | null;
}>;

export default function Logo(props: LogoProps): React.ReactElement;
  