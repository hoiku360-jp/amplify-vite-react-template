
import * as React from 'react';

import { FlexProps, SelectFieldProps, ButtonProps } from '@aws-amplify/ui-react';

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

export declare type FiltersOverridesProps = {
  'SelectField38963527'?: PrimitiveOverrideProps<SelectFieldProps>;
  'SelectField38963544'?: PrimitiveOverrideProps<SelectFieldProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
} & EscapeHatchProps;

export declare type FiltersProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: FiltersOverridesProps | undefined | null;
}>;

export default function Filters(props: FiltersProps): React.ReactElement;
  