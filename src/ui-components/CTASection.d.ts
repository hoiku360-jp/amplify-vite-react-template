
import * as React from 'react';

import { FlexProps, TextProps, TextFieldProps, ButtonProps } from '@aws-amplify/ui-react';

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

export declare type CTASectionOverridesProps = {
  'Newsletter'?: PrimitiveOverrideProps<TextProps>;
  'Stay in touch and never miss an update'?: PrimitiveOverrideProps<TextProps>;
  'Keep up to date on the latest and greatest in the frontend and fullstack community'?: PrimitiveOverrideProps<TextProps>;
  'Frame 436'?: PrimitiveOverrideProps<FlexProps>;
  'TextField'?: PrimitiveOverrideProps<TextFieldProps>;
  'Button'?: PrimitiveOverrideProps<ButtonProps>;
  'Form'?: PrimitiveOverrideProps<FlexProps>;
  'Type Lock Up'?: PrimitiveOverrideProps<FlexProps>;
} & EscapeHatchProps;

export declare type CTASectionProps = React.PropsWithChildren<Partial<FlexProps> & {

  overrides?: CTASectionOverridesProps | undefined | null;
}>;

export default function CTASection(props: CTASectionProps): React.ReactElement;
  