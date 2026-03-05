
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

export declare type DataRowOverridesProps = {
  'label'?: PrimitiveOverrideProps<TextProps>;
  'value'?: PrimitiveOverrideProps<TextProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
} & EscapeHatchProps;

export declare type DataRowProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: DataRowOverridesProps | undefined | null;
}>;

export default function DataRow(props: DataRowProps): React.ReactElement;
  